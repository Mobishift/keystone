module.exports = function (req) {
    var keystone = this;
    
	if (!keystone.nav) {
		keystone.nav = keystone.initNav();
	}

	var user_permission = "user";
	if(req && req.user && req.user.permission) user_permission = req.user.permission;
	
	var nav = {
		sections: [],
		by: {
			list: {},
			section: {}
		}
	};
    var filter_lists = function(lists){
        var new_lists = [];
        for(var i=0; i<lists.length; i++){
            var list = lists[i];
            if(list.hidden_permissions.indexOf(user_permission) == -1){
                new_lists.push(list);
            }
        }
        return new_lists;
    }
    var filter_item = function(item){
        var new_item = {};
        new_item.lists = filter_lists(item.lists);
        if (new_item.lists.length <= 0) return null;
        new_item.label = item.label;
        new_item.key = item.key;
        return new_item;
    }
    for(var i=0; i<keystone.nav.sections.length; i++){
        var item = keystone.nav.sections[i];
        var new_item = filter_item(item);
        if(new_item){
            nav.sections.push(new_item);
        }
    }
    var by_list_key = Object.getOwnPropertyNames(keystone.nav.by.list);
    var by_section_key = Object.getOwnPropertyNames(keystone.nav.by.section);
    for(var i=0; i<by_list_key.length; i++){
        var list_key = by_list_key[i];
        var list_value = keystone.nav.by.list[list_key];
        var new_list_value = filter_item(list_value);
        if(new_list_value){
            nav.by.list[list_key] = new_list_value;
        }
    }
    for(var i=0; i<by_section_key.length; i++){
        var section_key = by_section_key[i];
        var section_value = keystone.nav.by.section[section_key];
        var new_section_value = filter_item(list_value);
        if(new_section_value){
            nav.by.section[section_key] = new_section_value;
        }
    }
	return nav;
}