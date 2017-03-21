HL = {
	new_html: function new_html (html_type, html_class, html_parent) {
		var r = document.createElement(html_type);
		r.className = html_class;
		if (html_parent) html_parent.appendChild(r);
		return r
	},
	scale_html: function scale_html (element, scale) {
		element.style.webkitTransform = 'scale(' + scale + ',' + scale +')'
		element.style.msTransform = 'scale(' + scale + ',' + scale +')'
		element.style.transform = 'scale(' + scale + ',' + scale +')'
	},
	capitalize: function capitalize (string) {
		return string.charAt(0).toUpperCase() + string.splice(1)
	},
	add_class: function (e, c) {
		if (e.className.search(c)!=-1) return;
		e.className = e.className + ' ' + c
	},
	remove_class: function (e, c) {
		e.className = e.className.replace(c, '');
		e.className = e.className.replace('  ', ' ');
	},
}