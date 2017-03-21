game = {
	dir_list: [{left: -1, top: 0}, {left: 0, top: -1}, {left: 1, top: 0}, {left: 0, top: 1}],
	rev_dir: function rev_dir (dir, dont) {
		if (dont) return dir; 
		return {left: 'right', top: 'bottom'}[dir]
	},
	new_block: function new_block (bar, args, x, y) {
		var block = {
			x: x,
			y: y,
			bar: bar,
			is_origin: args.is_origin,
			is_terminal: args.is_terminal,
			start: args.start,
			end: args.end,
			dir: {
				left: game.dir_list[args.start].left * -1,
				top: game.dir_list[args.start].top * -1
			},
			length: 17,
			fill_start: args.is_origin ? 4 : 0,
			html: HL.new_html('div', 'block'),
			html_corners: [],
			html_sides: [],
			progress: 0,
			draw_fill: function draw_fill () {
				block.html_fill.style.left = ((block.progress * block.length + block.fill_start - 25) * block.dir.left) + 'px';
				block.html_fill.style.top = ((block.progress * block.length + block.fill_start - 25) * block.dir.top) + 'px';
			},
			advance: function advance (amount) {
				block.progress += amount;
				if (block.progress>=1) {
					var overflow = block.progress - 1;
					block.progress = 1;
					bar.complete_block(block, overflow);
				}
				block.draw_fill();
			},
			reset: function reset_block () {
				block.progress = 0;
				block.draw_fill();
			}
		}
				
		block.html_fill = HL.new_html('div', 'block_fill', block.html);		
		block.html_fill.style.backgroundColor = block.bar.color;
		var i, new_corner;
		
		for (i = 0; i < 4; i++) {
			new_corner = HL.new_html('div', 'block_border', block.html);
			new_corner.style[game.rev_dir('left', i%2)] = '0px';
			new_corner.style[game.rev_dir('top', Math.floor(i/2))] = '0px';
			new_corner.style.zIndex = '30';
			block.html_corners.push(new_corner);
		}
		
		if ((block.start!=0||block.is_origin)&&(block.end!=0||block.is_terminal)) {
			new_corner = HL.new_html('div', 'block_border', block.html);
			new_corner.style.left = '0px';
			new_corner.style.top = '3px';
			new_corner.style.height = '19px';
			new_corner.style.borderRight = '1px solid black';
		} else {
			block.html_corners[1].style.borderTop = '1px solid black';
			block.html_corners[3].style.borderBottom = '1px solid black';
			if (block.dir.left) block.length += 4;
		}
		
		if ((block.start!=1||block.is_origin)&&(block.end!=1||block.is_terminal)) {
			new_corner = HL.new_html('div', 'block_border', block.html);
			new_corner.style.left = '3px';
			new_corner.style.top = '0px';
			new_corner.style.width = '19px';
			new_corner.style.borderBottom = '1px solid black';
		} else {
			block.html_corners[3].style.borderRight = '1px solid black'
			block.html_corners[2].style.borderLeft = '1px solid black'
			if (block.dir.top) block.length += 4;
		}
		
		if ((block.start!=2||block.is_origin)&&(block.end!=2||block.is_terminal)) {
			new_corner = HL.new_html('div', 'block_border', block.html);
			new_corner.style.right = '0px';
			new_corner.style.top = '3px';
			new_corner.style.height = '19px';
			new_corner.style.borderLeft = '1px solid black';
		} else {
			block.html_corners[2].style.borderBottom = '1px solid black'
			block.html_corners[0].style.borderTop = '1px solid black'
			if (block.dir.left) block.length += 4;
		}
		
		if ((block.start!=3||block.is_origin)&&(block.end!=3||block.is_terminal)) {
			new_corner = HL.new_html('div', 'block_border', block.html);
			new_corner.style.left = '3px';
			new_corner.style.bottom = '0px';
			new_corner.style.width = '19px';
			new_corner.style.borderTop = '1px solid black';
		} else {
			block.html_corners[0].style.borderLeft = '1px solid black'
			block.html_corners[1].style.borderRight = '1px solid black'
			if (block.dir.top) block.length += 4;
		}
		
		return block
	},
	new_bar: function new_bar (args) {
		var bar = {
			type: args.type,
			height: args.height,
			width: args.width,
			color: args.color,
			map: {},
			html: HL.new_html('div', 'bar'),
			terminals: [],
			active: false,
			advance: function bar_advance (amount) {
				bar.current_block.advance(amount);
			},
			complete_block: function complete_block (block, overflow) {
				if (block.is_terminal) bar.check_terminate(overflow);
				else {
					var new_x = parseInt(block.x) + parseInt(game.dir_list[block.end].left);
					var new_y = parseInt(block.y) + parseInt(game.dir_list[block.end].top);
					bar.current_block = bar.map[new_x][new_y];
					bar.current_block.advance(overflow);
				}
			},
			check_terminate: function check_terminate (overflow) {
				var i;
				for (i in bar.terminals) {
					if (bar.terminals[i].progress<1) return false;
				}
				// Run function on success
				bar.reset();
				bar.advance(overflow);
			},
			reset: function bar_reset() {
				var x, y;
				for (x in bar.map) {
					for (y in bar.map[x]) {
						bar.map[x][y].reset()
					}
				}
				bar.current_block = bar.origin;
			}
		}
		
		bar.html.style.height = (25 * bar.height) + 'px';
		bar.html.style.width = (25 * bar.width) + 'px';
		
		bar.toolbar = HL.new_html('div', 'toolbar', game.toolbox.html_contents);
		
		bar.click_place = function () {
			game.field.hold_bar(bar);
			HL.add_class(bar.place_button, 'tool_button_highlight');
		};
		bar.click_store = function () {game.field.store_bar(bar)};

		bar.place_button = game.new_button({text: 'place_bar()', tip: 'place the bar on the field by clicking the cell you wish to place it in', result: bar.click_place, show_on: bar.toolbar});
		bar.store_button = game.new_button({text: 'store_bar()', tip: 'return the bar to the store', result: bar.click_store, show_on: bar.toolbar});
		
		bar.show_bar = function () {
			bar.place_button.style.display = bar.active ? 'none' : 'block';
			bar.store_button.style.display = bar.active ? 'block' : 'none';
			if (bar == game.field.held) HL.add_class(bar.place_button, 'tool_button_highlight');
			else HL.remove_class(bar.place_button, 'tool_button_highlight');
		}
		
		bar.hide_bar = function () {
			bar.toolbar.style.display = 'none';
		}
		
		bar.click_me = function (e) {
			e.stopPropagation();
			game.toolbox.select(bar);
		}
		
		bar.html.addEventListener('click', bar.click_me);
		
		var x, y, new_block;
		
		for (x in args.blocks) {
			for (y in args.blocks[x]) {
				if (!bar.map[x]) bar.map[x] = {};
				new_block = game.new_block(bar, args.blocks[x][y], x, y);
				if (new_block.is_origin) bar.origin = new_block;
				if (new_block.is_terminal) bar.terminals.push(new_block)
				new_block.html.style.left = (x * 25) + 'px';
				new_block.html.style.top = (y * 25) + 'px';
				bar.html.appendChild(new_block.html);
				bar.map[x][y] = new_block;
			}
		}
		
		bar.current_block = bar.origin;
				
		return bar
	},
	new_button: function new_button (args) {
		var button = HL.new_html('div', 'tool_button', args.show_on);
		button.innerHTML = args.text;
		button.click_me = function () {args.result()};
		button.mouseover_me = function () {game.tooltip.show(args.tip)};
		button.addEventListener('click', button.click_me);
		button.addEventListener('mouseover', button.mouseover_me);
		button.addEventListener('mouseout', game.tooltip.hide);
		return button;
	},
	automate: function automate () {
		var i;
		for (i in game.field.bars) {
			game.field.bars[i].bar.advance(.05);
		}
	}
}

game.tooltip = new function tooltip () {
	var tooltip = this;
	
	tooltip.html = HL.new_html('div', 'tooltip', document.body);
	
	tooltip.show = function show_tooltip (text) {
		tooltip.html.innerHTML = text;
	}
	
	tooltip.hide = function hide_tooltip () {
		tooltip.html.innerHTML = '';
	}
}

game.clock = new function clock () {
	var clock = this;
	var clockwork;
	var fps = 10;
	
	function tick() {
		game.automate();
	}
	
	clock.start = function clock_start () {
		clearInterval(clockwork);
		clockwork = setInterval(tick, 1000/fps)
	}
	clock.stop = function clock_stop () {
		clearInterval(clockwork);
	}
}

game.field = new function field () {
	var field = this;
	
	field.html = HL.new_html('div', 'field', document.body);
	field.bars = [];
	
	field.cells  = [];
	
	function new_cell (x, y) {
		var cell = HL.new_html('div', 'cell', field.html);
		cell.field_placement = {x: x, y: y};
		cell.style.left = (x * 25) + 'px';
		cell.style.top = (y * 25) + 'px';
		cell.my_mouseover = function () {mouseover_cell(x, y)};
		cell.my_click = function () {field.place_bar(field.held, x, y)};
		cell.addEventListener('click', cell.my_click);
		cell.addEventListener('mouseover', cell.my_mouseover);
		cell.addEventListener('mouseout', field.clear_highlights);
		field.cells[x][y] = cell;
	}
	
	function mouseover_cell (x, y) {
		if (!field.held) return;
		var i, j, h_x, h_y, h_class = field.test_bar(field.held, x, y) ? 'cell_highlight_green' : 'cell_highlight_red';
		for (i in field.held.map) {
			for (j in field.held.map[i]) {
				h_x = x + parseInt(i);
				h_y = y + parseInt(j);
				if (field.cells[h_x] && field.cells[h_x][h_y]) HL.add_class(field.cells[h_x][h_y], h_class);
			}
		}
	}
	
	field.clear_highlights = function clear_highlights() {
		var i, j;
		for (i in field.cells) {
			for (j in field.cells[i]) {
				HL.remove_class(field.cells[i][j], 'cell_highlight_green');
				HL.remove_class(field.cells[i][j], 'cell_highlight_red');
			}
		}
	}
	
	field.test_bar = function test_bar (bar, x, y) {
		var i, j, check_x, check_y, pass = true;
		for (i in bar.map) {
			for (j in bar.map[i]) {
				check_x = x + parseInt(i);
				check_y = y + parseInt(j);
				if (!field.cells[check_x] || !field.cells[check_x][check_y] || field.cells[check_x][check_y].contains_block) pass = false;
			}
		}
		return pass;
	}
	
	field.place_bar = function place_bar (bar, x, y) {
		if (!field.test_bar(bar, x, y)) return;
		field.held = false;
		field.clear_highlights();
		game.storage.remove_bar(bar);
		var i, j, low_x, low_y;
		for (i in bar.map) {
			if (!low_x || i < low_x) low_x = i;
			for (j in bar.map[i]) {
				if (!low_y || j < low_y) low_y = j;
				field.cells[x+parseInt(i)][y+parseInt(j)].contains_block = bar.map[i][j]
			}
		}
		HL.scale_html(bar.html, 1)
		bar.html.style.left = ((x + parseInt(low_x)) * 25) + 'px';
		bar.html.style.top = ((y + parseInt(low_y)) * 25) + 'px';
		bar.active = true;
		field.html.appendChild(bar.html);
		field.bars.push ({
			x: x,
			y: y,
			bar: bar
		})
		if (bar == game.toolbox.selected) game.toolbox.select(bar);
		field.held = false;
		
	}
	
	field.store_bar = function store_bar (bar) {
		var i, j, k, found = false, field_bar;
		for (i in field.bars) {
			if (field.bars[i].bar) {
				k = i;
				found = true;
				field_bar = field.bars[i];
				break;
			}
		}
		if (!found) return;
		for (i in field_bar.bar.map) {
			for (j in field_bar.bar.map[i]) {
				field.cells[parseInt(field_bar.x) + parseInt(i)][parseInt(field_bar.y) + parseInt(j)].contains_block = false;
			}
		}
		field.bars.splice(k, 1);
		bar.active = false;
		game.storage.add_bar(bar);
	}
	
	field.hold_bar = function hold_bar (bar) {
		field.held = bar;
	}

	field.resize = function resize (x, y) {
		field.height = y;
		field.width = x;
		var i, j;
		for (i = 0; i < field.width; i++) {
			for (j = 0; j < field.height; j++) {
				if (!field.cells[i]) field.cells[i] = [];
				if (!field.cells[i][j]) new_cell(i, j);
			}
		}
	}
	
	field.resize(4, 4);
	
	
	field.bars = [];
}

game.storage = new function storage () {
	var storage = this;
	
	storage.html = HL.new_html('div', 'storage', document.body);
	storage.html_header = HL.new_html('div', 'storage_header', storage.html);
	storage.html_contents = HL.new_html('div', 'storage_contents', storage.html);
	storage.html_header.innerHTML = 'storage';
	
	storage.content = [];
	storage.boxes = [];
	
	storage.add_bar = function add_bar (bar) {
		storage.content.push(bar);
		storage.redraw();
	};
	
	storage.remove_bar = function remove_bar (bar) {
		var k = storage.content.indexOf(bar);
		if (k==-1) return;
		storage.content.splice(k, 1);
		storage.redraw();
	};
	
	storage.redraw = function redraw () {
		var i, new_box;
		for (i = storage.boxes.length; i < storage.content.length; i++) {
			var new_box = HL.new_html('div', 'storage_box', storage.html_contents);
			new_box.style.left = (i * 60) + 'px'
			storage.boxes.push(new_box);
		}		
		for (i = 0; i < storage.boxes.length; i++) {
			if (storage.content[i]) {
				HL.scale_html(storage.content[i].html, 1.6 / storage.content[i].width);
				storage.content[i].html.style.top = '5px';
				storage.content[i].html.style.left = '5px';
				storage.boxes[i].appendChild(storage.content[i].html);
				storage.boxes[i].style.display = 'block';
			} else {
				storage.boxes[i].style.display = 'none';
			}
		}
	};
}

game.toolbox = new function toolbox () {
	var toolbox = this;
	
	toolbox.html = HL.new_html('div', 'toolbox', document.body);
	toolbox.html_header = HL.new_html('div', 'toolbox_header', toolbox.html);
	toolbox.html_contents = HL.new_html('div', 'toolbox_contents', toolbox.html);
	
	toolbox.select = function select_tool (tool) {
		if (toolbox.selected) toolbox.selected.toolbar.style.display = 'none';
		toolbox.selected = tool;
		tool.toolbar.style.display = 'block';
		tool.show_bar();
	}
}

game.storage.add_bar(game.new_bar({
	type: 'progress',
	color: 'blue',
	height: 1,
	width: 4,
	blocks: {
		0: {0: {start: 0, end: 2, is_origin: true}},
		1: {0: {start: 0, end: 2}},
		2: {0: {start: 0, end: 2}},
		3: {0: {start: 0, end: 2, is_terminal: true}}
	}
}));

game.storage.add_bar(game.new_bar({
	type: 'progress',
	color: 'blue',
	height: 1,
	width: 4,
	blocks: {
		0: {0: {start: 0, end: 2, is_origin: true}},
		1: {0: {start: 0, end: 2}},
		2: {0: {start: 0, end: 2}},
		3: {0: {start: 0, end: 2, is_terminal: true}}
	}
}));

game.clock.start();