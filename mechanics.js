game = {
	dir_list: [{left: -1, top: 0}, {left: 0, top: -1}, {left: 1, top: 0}, {left: 0, top: 1}],
	rev_dir: function rev_dir (dir, dont) {
		if (dont) return dir; 
		return {left: 'right', top: 'bottom'}[dir]
	},
	number_format: function number_format (x) {
		return Math.pow(2, x);
	},
	format_number: function format_number (x) {
		var i = 0;
		while (game.number_format(i) <= x) {
			i++
		}
		if (i>0) i--;
		return Math.floor(x / game.number_format(i) * 100)/100 + (i > 0 ? ' &#215; f('+i+')' : '');
	},
	bar_counts: {},
	new_block: function new_block (bar, args, x, y) {
		var block = {
			x: x,
			y: y,
			bar: bar,
			speed: args.speed,
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
		block.html_fill.style.backgroundColor = game.bar_types[block.bar.type].color;
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
			name: args.name,
			map: {},
			speed: args.speed,
			save_ids: game.bar_types[args.type].save_ids,
			html: HL.new_html('div', 'bar'),
			terminals: [],
			active: false,
			advance: function bar_advance (amount) {
				bar.current_block.advance(amount);
			},
			tick: function bar_tick (fps) {
				if (bar.halt) return;
				bar.advance(bar.speed/fps)
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
				game.bar_types[bar.type].outcome(bar);
				bar.terminate(overflow);
			},
			terminate: function bar_terminate (overflow) {
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
		
		if (!bar.name) {
			if (typeof(game.bar_counts[bar.type])=='undefined') game.bar_counts[bar.type] = 0;
			else game.bar_counts[bar.type]++;
			bar.name = bar.type + '_bar [' + game.bar_counts[bar.type] + ']';
		}
		
		var i;
		for (i in bar.save_ids) {
			bar[bar.save_ids[i]] = args[bar.save_ids[i]];
		}
		
		bar.toolbar = HL.new_html('div', 'toolbar', game.toolbox.html_contents);
		
		bar.click_store = function () {
			if (game.storage.content.indexOf(bar)!=-1) return;
			game.field.remove_bar(bar);
			game.storage.add_bar(bar);
		};

		bar.store_button = game.new_button({text: 'store_bar', tip: 'place the bar in storage', result: bar.click_store, show_on: bar.toolbar});
		
		bar.show_toolbar = function () {
			bar.store_button.style.display = bar.active ? 'block' : 'none';
		}
		
		bar.hide_bar = function () {
			bar.toolbar.style.display = 'none';
		}
		
		bar.click_me = function (e) {
			game.toolbox.select(bar);
		}
		
		bar.html.addEventListener('click', bar.click_me);
		
		var x, y, min_x = 0, max_x = 0, min_y = 0, max_y = 0, block_count = 0, new_block;
		
		for (x in args.blocks) {
			min_x = Math.min(parseInt(x), min_x);
			max_x = Math.max(parseInt(x), max_x);
			for (y in args.blocks[x]) {
				min_y = Math.min(parseInt(y), min_y);
				max_y = Math.max(parseInt(y), max_y);
				block_count++;
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
		
		bar.height = max_y - min_y + 1;
		bar.width = max_x - min_x + 1;
		bar.length = block_count;		
		
		/*bar.html.style.height = (25 * bar.height) + 'px';
		bar.html.style.width = (25 * bar.width) + 'px';*/

		bar.current_block = bar.origin;
		
		bar.save_info = function return_save_info() {
			var i, j, p = 0, saves = {
				name: bar.name,
				type: bar.type,
				height: bar.height,
				width: bar.width,
				speed: bar.speed,
				blocks: {}
			}
			
			for (i in bar.save_ids) {
				saves[bar.save_ids[i]] = bar[bar.save_ids[i]]
			}
			
			for (i in bar.map) {
				if (!saves.blocks[i]) saves.blocks[i] = {}
				for (j in bar.map[i]) {
					saves.blocks[i][j] = {
						start: bar.map[i][j].start,
						end: bar.map[i][j].end,
						is_origin: bar.map[i][j].is_origin,
						is_terminal: bar.map[i][j].is_terminal
					}
					p += bar.map[i][j].progress
				}
			}
			
			saves.progress = p;
			
			return saves;
		}
		
		if (game.bar_types[bar.type].bar_mods) game.bar_types[bar.type].bar_mods(bar);
		
		if (args.progress) bar.advance(args.progress);
				
		return bar
	},
	new_button: function new_button (args) {
		var button = HL.new_html('div', 'tool_button', args.show_on);
		button.button_label = HL.new_html('div', 'tool_button_text', button);
		button.inaction = args.inactive;
		button.press = function () {HL.add_class(button.button_label, 'tool_button_press');}
		button.unpress = function () {HL.remove_class(button.button_label, 'tool_button_press');}
		button.button_label.innerHTML = args.text + '()';
		button.click_me = function () {
			if (button.inactive&&button.inactive()) return;
			if (button.cost_to_press) {
				if (!game.cashbox.has(button.cost_to_press)) return;
				game.cashbox.spend(button.cost_to_press);
			}
			button.press();
			setTimeout(button.unpress, 100);
			args.result();
		};
		if (args.cost) {
			button.update_cost = function () {
				button.cost_to_press = args.cost();
				button.button_label.innerHTML = args.text + '(' + game.cashbox.format(button.cost_to_press) + ')';
			}
			button.update_cost();
		}
		button.mouseover_me = function () {game.tooltip.show(args.tip)};
		button.addEventListener('click', button.click_me);
		button.addEventListener('mouseover', button.mouseover_me);
		button.addEventListener('mouseout', game.tooltip.hide);
		return button;
	},
	new_radio: function new_radio (args) {
		var i, option, radio = HL.new_html('div', 'tool_radio', args.show_on);
		radio.options_list = [];
		radio.on_choice = args.on_choice;
		function create_option (name) {
			var option = HL.new_html('div', 'tool_radio_option', radio);
			option.innerHTML = name
			option.click_me = function () {
				radio.choice = name;
				var i;
				for (i in radio.options_list) {
					HL.remove_class(radio.options_list[i], 'tool_radio_selected')
				}
				HL.add_class(option, 'tool_radio_selected');
				if (radio.on_choice) radio.on_choice(name);
			}
			option.addEventListener('click', option.click_me);
			if (args.start_value == name) option.click_me();
			radio.options_list.push(option);
		}
		for (i in args.options) {
			create_option(args.options[i]);
		}
		return radio;
	},
	bar_types: {
		progress: {
			available: true,
			outcome: function (bar) {
				game.cashbox.gain({progress: Math.pow(bar.length, 2)});
			},
			color: 'blue',
			create_bar: function () {
				var length = 2;
				var i, bar_args = {
					type: 'progress',
					speed: 0.5,
					blocks: {}
				};
				for (i = 0; i < length; i++) {
					bar_args.blocks[i] = {
						0: {start: 0, end: 2}
					}
				}
				bar_args.blocks[0][0].is_origin = true;
				bar_args.blocks[length - 1][0].is_terminal = true;
				game.storage.add_bar(game.new_bar(bar_args))
			},
			bar_mods: function (bar) {
				bar.no_room = function () {
					if (bar.active && (!game.field.cells[bar.field_x + bar.length] || game.field.cells[bar.field_x + bar.length][bar.field_y].contains_block)) return true;
				}
				bar.grow = function grow_bar () {
					var bar_args = bar.save_info();
					delete bar_args.blocks[bar.length-1][0].is_terminal;
					bar_args.blocks[bar.length] = [{start: 0, end: 2, is_terminal: true}];
					var grown = game.new_bar(bar_args);
					if (bar.active) {
						game.field.remove_bar(bar);
						game.field.place_bar(grown, bar.field_x, bar.field_y);
					} else {
						game.storage.remove_bar(bar);
						game.storage.add_bar(grown);
					}
					if (game.toolbox.selected = bar) game.toolbox.select(grown);
				}
				bar.grow_cost = function grow_cost () {
					return {progress: bar.length * 5 * Math.pow(1.8, bar.length-2)}
				}
				bar.grow_button = game.new_button({
					text: 'extend_bar', 
					tip: 'progress gained from completing bars grows more than linearly with bar length',
					result: bar.grow, 
					cost: bar.grow_cost,
					inactive: bar.no_room,
					show_on: bar.toolbar
				})
			},
			cost: function () {return {progress: 10 * (game.bar_counts.progress + 1 || 0)}}
		},
		click: {
			outcome: function (bar) {
				game.cashbox.gain({progress: Math.pow(bar.legnth, 2)});
			},
			color: 'skyblue',
			create_bar: function (length) {
				var i, bar_args = {
					type: 'progress',
					speed: 0.5,
					blocks: {}
				};
				for (i = 0; i < length; i++) {
					bar_args.blocks[i] = {
						0: {start: 0, end: 2}
					}
				}
				bar_args.blocks[0][0].is_origin = true;
				bar_args.blocks[length - 1][0].is_terminal = true;
				var bar = game.new_bar(bar_args);
			}
		},
		expansion: {
			outcome: function (bar) {
				if (bar.width == game.field.width) {
					game.field.resize(bar.width + 1, game.field.height)
				}
				if (bar.height == game.field.height) {
					game.field.resize(game.field.width, bar.height + 1)
				}
			},
			color: 'red',
			save_ids: ['halt'],
			create_bar: function () {
				var i, dir = game.bar_types.expansion.direction, bar_args = {
					type: 'expansion',
					blocks: {}
				};
				if (dir=='x') {
					var length = game.field.width;
					for (i = 0; i < length; i++) {
						bar_args.blocks[i] = {
							0: {start: 0, end: 2}
						}
					}
					bar_args.blocks[0][0].is_origin = true;
					bar_args.blocks[length - 1][0].is_terminal = true;
				} else if (dir=='y') {
					var length = game.field.height;
					bar_args.blocks[0] = {};
					for (i = 0; i < length; i++) {
						bar_args.blocks[0][i] = {start: 1, end: 3}
					}
					bar_args.blocks[0][0].is_origin = true;
					bar_args.blocks[0][length-1].is_terminal = true;
				}
				bar_args.speed = 0.5 / Math.pow(2, length);
				var bar = game.new_bar(bar_args);
				game.storage.add_bar(bar);
			},
			bar_mods: function (bar) {
				bar.terminate = function expansion_terminate() {
					bar.halt = true;
				}
			},
			direction: 'x',
			cost: function () {
				var old_squares = game.field.width * game.field.height, new_squares;
				var new_squares;
				if (game.bar_types.expansion.direction== 'x') new_squares = (game.field.width + 1) * game.field.height;
				else new_squares = game.field.width * (game.field.height + 1);
				return {progress: (Math.pow(1.15, old_squares) * Math.pow(1.15, new_squares))/.15}
			},
			sale_radios: {
				direction: {options: ['x', 'y'], start_value: 'x'}
			}
		},
		development: {
			outcome: function (bar) {
				game.developments[bar.development_outcome].done = true;
				game.developments[bar.development_outcome].complete();
			},
			color: 'peru',
			save_ids: ['development_outcome'],
			bar_mods: function (bar) {
				bar.terminate = function expansion_terminate() {
					bar.halt = true;
				}
			}
		}
	},
	developments: {
		extension_bars: {
			name: 'unlock_extension_bars',
			available: true,
			create_bar: function () {
				var i, bar_args = {
					type: 'development',
					blocks: {
						0: {0: {start: 0, end: 2, is_origin: true}},
						1: {0: {start: 0, end: 3}, 1: {start: 1, end: 2}},
						2: {1: {start: 0, end: 2, is_terminal: true}}
					},
					development_outcome: 'extension_bars',
					speed: 0.1
				};
				var bar = game.new_bar(bar_args);
				game.storage.add_bar(bar);
			},
			complete: function () {
				game.bar_types.expansion.available = true;
			},
			cost: function () {return {progress: 50}}
		}
	},
	save_game: function () {
		var save_state = {}
		
		// save bars in field
		save_state.field = [];
		var save_bar, i;
		for (i in game.field.bars) {
			save_bar = {
				x: game.field.bars[i].x,
				y: game.field.bars[i].y,
				bar: game.field.bars[i].bar.save_info()
			}
			
			save_state.field.push(save_bar)
		}
		
		// save bars in storage
		save_state.storage = [];
		for (i in game.storage.content) {
			save_state.storage.push(game.storage.content[i].save_info())
		}
		
		// save developments
		save_state.developments = {};
		for (i in game.developments) {
			save_state.developments[i] = {
				bought: game.developments[i].bought, done: game.developments[i].done
			}
		}
		
		save_state.cash = {}
		
		for (i in game.cashbox.cash) {
			save_state.cash[i] = game.cashbox.cash[i].value;
		}
		
		save_state.bar_counts = game.bar_counts;
		
		save_state.field_size = [game.field.width, game.field.height];
		
		save_state = JSON.stringify(save_state);
		
		localStorage.progress_tris = save_state
	},
	load_game: function () {
		var i, save_state = localStorage.progress_tris;
		
		save_state = JSON.parse(save_state);
		
		if (save_state.field_size) {
			game.field.resize(save_state.field_size[0], save_state.field_size[1])
		}
		
		if (save_state.field) {
			var load_bar;
			for (i in save_state.field) {
				load_bar = game.new_bar(save_state.field[i].bar);
				game.field.place_bar(load_bar, save_state.field[i].x, save_state.field[i].y);
			}
		}
		
		if (save_state.developments) {
			for (i in save_state.developments) {
				game.developments[i].bought = save_state.developments[i].bought;
				if (save_state.developments[i].done) {
					game.developments[i].done = true;
					game.developments[i].complete()
				}
			}
		}
		
		if (save_state.storage) {
			var load_bar;
			for (i in save_state.storage) {
				load_bar = game.new_bar(save_state.storage[i]);
				game.storage.add_bar(load_bar);
			}
		}
		
		if (save_state.cash) {
			game.cashbox.gain(save_state.cash);
		}
		
		if (save_state.bar_counts) {
			game.bar_counts = save_state.bar_counts
		}
		
		
	},
	start_game: function () {
		if (localStorage.progress_tris) {
			game.load_game()
		}
		game.clock.start();
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
	
	clock.tick_fragments = 0;
	
	function tick() {
		var i, num_ticks = 1;
		if (clock.last_time) {
			var new_time = new Date().getTime();
			var time_elapsed = new_time - clock.last_time;
			num_ticks = time_elapsed / 1000 * fps;
			clock.last_time = new_time;
		} else {
			clock.last_time = new Date().getTime();
		}
		clock.tick_fragments += num_ticks;
		while (Math.round(clock.tick_fragments*10)/10>=1) {
			for (i in game.field.bars) {
				game.field.bars[i].bar.tick(fps);
			}
			clock.tick_fragments--;
		}
	}
	
	clock.start = function clock_start () {
		clearInterval(clockwork);
		clockwork = setInterval(tick, 1000 / fps)
	}
	clock.stop = function clock_stop () {
		clearInterval(clockwork);
	}
}

game.toolbox = new function toolbox () {
	var toolbox = this;
	
	toolbox.html = HL.new_html('div', 'toolbox', document.body);
	toolbox.html_cashbox = HL.new_html('div', 'toolbox_cashbox', toolbox.html);
	toolbox.html_header = HL.new_html('div', 'toolbox_header', toolbox.html);
	toolbox.html_contents = HL.new_html('div', 'toolbox_contents', toolbox.html);
	
	toolbox.select = function select_tool (tool) {
		if (toolbox.selected) toolbox.selected.toolbar.style.display = 'none';
		game.storage.unselect();
		toolbox.selected = tool;
		toolbox.html_header.innerHTML = tool.name;
		tool.toolbar.style.display = 'block';
		tool.show_toolbar();
	}
}

game.cashbox = new function cashbox () {
	var cashbox = this;
	
	cashbox.html = HL.new_html('div', 'toolbox_cashbox', game.toolbox.html_cashbox);
	
	cashbox.cash = {};
	
	cashbox.new_cash_type = function new_cash_type (args) {
		var cash_type = {
			value: 0,
			name: args.name,
			color: args.color,
			html: HL.new_html('div', 'cash', cashbox.html)
		}
		
		cash_type.html_icon = HL.new_html('div', 'cash_icon', cash_type.html)
		cash_type.html_icon.innerHTML = '&#8226; ';
		cash_type.html_icon.style.color = cash_type.color;
		
		cash_type.html_value = HL.new_html('div', 'cash_amount', cash_type.html)
		cash_type.html_value.innerHTML = '0';
		
		cashbox.cash[cash_type.name] = cash_type
	}
	
	function update_value (type, amount) {
		cashbox.cash[type].value += amount;
		cashbox.cash[type].html_value.innerHTML = game.format_number(cashbox.cash[type].value/100);
	}	
	
	cashbox.has = function has (amount) {
		var i;
		for (i in amount) if (cashbox.cash[i].value < amount[i]) return false;
		return true
	}
	
	cashbox.spend = function spend (amount) {
		var i;
		for (i in amount) update_value(i, -amount[i])
	}

	cashbox.gain = function gain (amount) {
		var i;
		for (i in amount) update_value(i, amount[i])
	}

	cashbox.format = function format (amount) {
		var i, r = '';
		for (i in amount) {
			r += '<span style=\'color:' +cashbox.cash[i].color+'\'>&#8226;</span> '+game.format_number(amount[i]/100)+','
		}
		if (r.length > 0) r = r.substring(0, r.length-1);
		return r;
	}
	
}
game.cashbox.new_cash_type({
	name: 'progress',
	color: 'blue'
})

game.bar_store = new function bar_store () {
	var store = this;
	
	store.content = {};
	store.name = 'create_bars'
	store.toolbar = HL.new_html('div', 'toolbar', game.toolbox.html_contents);
	store.show_toolbar = function () {
		var i;
		for (i in store.content) {
			if (game.bar_types[i].available) {
				store.content[i].html.style.display = 'block';
				store.content[i].buy_button.update_cost();
			}
			else store.content[i].html.style.display = 'none';
		}
	};
	
	store.add_content = function add_content (bar_type) {
		var i, sale = {
			html: HL.new_html('div', 'sale_item', store.toolbar),
			bar_ref: game.bar_types[bar_type],
			radios: {}
		}
		
		sale.click_me = function click_sale() {
			sale.bar_ref.create_bar();
			sale.buy_button.update_cost();
		}
		
		sale.buy_button = game.new_button({text: bar_type, tip: sale.bar_ref.description, result: sale.click_me, cost: sale.bar_ref.cost, show_on: sale.html})
		
		sale.sub_html = HL.new_html('div', 'sale_sub', sale.html)
		
		function build_radio (name) {
			var radio = game.new_radio({
				options: sale.bar_ref.sale_radios[name].options, 
				on_choice: function (choice) {
					sale.bar_ref[name] = choice; 
					sale.buy_button.update_cost()
				}, 
				start_value: sale.bar_ref.sale_radios[name].start_value, 
				show_on: sale.sub_html})
			sale.radios[i] = radio;
		}
		
		for (i in sale.bar_ref.sale_radios){
			build_radio(i);
		}
		
		store.content[bar_type] = sale;
	}

}

game.development = new function development () {
	var store = this;
	
	store.content = {};
	store.name = 'development'
	store.toolbar = HL.new_html('div', 'toolbar', game.toolbox.html_contents);
	store.show_toolbar = function () {
		var i;
		for (i in store.content) {
			if (game.developments[i].available && !game.developments[i].bought) {
				store.content[i].html.style.display = 'block';
				store.content[i].buy_button.update_cost();
			}
			else store.content[i].style.display = 'none';
		}
	};
	
	store.add_content = function add_content (res_type) {
		var i, sale = {
			html: HL.new_html('div', 'sale_item', store.toolbar),
			res_ref: game.developments[res_type],
			radios: {}
		}
		
		sale.click_me = function click_sale() {
			sale.res_ref.create_bar();
			sale.res_ref.bought = true;
			sale.buy_button.update_cost();
		}
		
		sale.buy_button = game.new_button({text: res_type, tip: sale.res_ref.description, result: sale.click_me, cost: sale.res_ref.cost, show_on: sale.html})
		
		store.content[res_type] = sale;
	}

}

game.menu = new function menu () {
	var menu = this;
	
	menu.html = HL.new_html('div', 'menu', document.body);
	
	menu.save_game = game.new_button({text: 'save_game', tip: 'save the current game state', result: game.save_game, show_on: menu.html, cost: function () {return {progress: 10}}})
	menu.open_store = game.new_button({text: 'create_bars', tip: 'create new bars; newly created bars are placed in storage, click them to place them on the field', result: function () {game.toolbox.select(game.bar_store)}, show_on: menu.html})
	menu.open_development = game.new_button({text: 'development', tip: 'complete development to unlock new options', result: function () {game.toolbox.select(game.development)}, show_on: menu.html})
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
		cell.my_click = function () {field.place_bar(game.storage.selected, x, y)};
		cell.addEventListener('click', cell.my_click);
		cell.addEventListener('mouseover', cell.my_mouseover);
		cell.addEventListener('mouseout', field.clear_highlights);
		field.cells[x][y] = cell;
	}
	
	function mouseover_cell (x, y) {
		if (!game.storage.selected) return;
		var i, j, h_x, h_y, h_class = field.test_bar(game.storage.selected, x, y) ? 'cell_highlight_green' : 'cell_highlight_red';
		for (i in game.storage.selected.map) {
			for (j in game.storage.selected.map[i]) {
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
		if (!bar || !field.test_bar(bar, x, y)) return;
		game.storage.unselect();
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
		bar.field_x = x;
		bar.field_y = y;
		field.bars.push ({
			x: x,
			y: y,
			bar: bar
		})
		if (bar == game.toolbox.selected) game.toolbox.select(bar);		
	}
	
	field.remove_bar = function remove_bar (bar) {
		var i, j, k, found = false, field_bar;
		for (i in field.bars) {
			if (field.bars[i].bar == bar) {
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
		if (bar.html.parentNode) bar.html.parentNode.removeChild(bar.html);
		bar.active = false;
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
	
	field.resize(4, 2);
	
	
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
		if (bar.html.parentNode) bar.html.parentNode.removeChild(bar.html);
		storage.redraw();
	};
	
	storage.unselect = function unselect_storage () {
		if (storage.selected_box) HL.remove_class(storage.selected_box, 'storage_box_highlight')
		storage.selected_box = false;
		storage.selected = false;
	}
	
	function new_box(n) {
		var box = HL.new_html('div', 'storage_box', storage.html_contents);
		box.style.left = (n * 60) + 'px';
		storage.boxes.push(box);
		box.click_me = function () {
			if (storage.selected_box) HL.remove_class(storage.selected_box, 'storage_box_highlight')
			storage.selected_box = box;
			HL.add_class(box, 'storage_box_highlight');
			storage.selected = box.content;
		}
		box.addEventListener('click', box.click_me);
	}
	
	storage.redraw = function redraw () {
		var i;
		for (i = storage.boxes.length; i < storage.content.length; i++) {
			new_box(i);
		}		
		for (i = 0; i < storage.boxes.length; i++) {
			if (storage.content[i]) {
				var scaling = Math.min(1.6/storage.content[i].width, 1.6/storage.content[i].height);
				HL.scale_html(storage.content[i].html, scaling);
				storage.content[i].html.style.top = '5px';
				storage.content[i].html.style.left = '5px';
				storage.boxes[i].appendChild(storage.content[i].html);
				storage.boxes[i].style.display = 'block';
				storage.boxes[i].content = storage.content[i];
			} else {
				storage.boxes[i].style.display = 'none';
			}
		}
	};
}

game.bar_store.add_content('progress');
game.bar_store.add_content('expansion');
game.development.add_content('extension_bars');
game.start_game();