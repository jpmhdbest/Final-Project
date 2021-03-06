$(function() {
    var category =1;
    var app = {
        init: function() {
            this.user = {};
            $('.menu-crud').addClass('hidden');
            $('.menu-user').addClass('hidden');
            $('.menu-loading').removeClass('hidden');
            $('.menu-user').addClass('hidden');
            $('.btn-login').addClass('hidden');
            $('.searchbar').addClass('hidden');
            $('.btn-login').attr('href', '/api/login?url=/');
            $('.btn-logout').attr('href','/api/logout?url=/');
            this.router = new Router();
            this.setEventListeners();
            this.getUser();
            Backbone.history.start({pushState: true});
        },
        setEventListeners: function() {
            var self = this;
            $('.menu-list').popover({ trigger: "hover" });
            $('.menu-create').popover({ trigger: "hover" });
            $('.menu-search').popover({ trigger: "hover" });
            $('.menu-mylist').popover({ trigger: "hover" });
            $('.menu-crud .item a').click(function(ev) {
                var $el = $(ev.target).closest('.item');
                $('.menu-crud .item').removeClass('active');
                $el.addClass("active");
                if ($el.hasClass('menu-list')) {    
                    $('.searchbar').addClass('hidden');
                    category=1;
                    self.router.navigate('list', {trigger: true});
                }
                if ($el.hasClass('menu-create')) {
                    $('.searchbar').addClass('hidden');
                    self.router.navigate('new', {trigger: true});
                }
                if ($el.hasClass('menu-search')) {
                    $('.searchbar').removeClass('hidden');
                    $('.app-content').html('');
                    self.router.navigate('search?=', {trigger: true});
                }
                if ($el.hasClass('menu-mylist')) {
                    $('.searchbar').addClass('hidden');
                    category=2;
                    self.router.navigate('list2', {trigger: true});
                }
            });
            $('.form-search').unbind('submit').submit(function(ev) {
                self.router.navigate('search?=' + $('.search-input').val(), {trigger: true});
                return false;
            });
        },
        getUser: function() {
            var self = this;
            $.ajax({
                method: 'GET',
                url: '/api/users/me',
                success: function(me) {
                    self.user = me;
                    self.showLogout();
                },
                error: function(err) {
                    self.showLogin();
                }
            });
        },
        showLogin: function() {
           $('.menu-loading').addClass('hidden');
           $('.menu-user').addClass('hidden');
           $('.btn-login').removeClass('hidden');
        },
        showLogout: function() {
           var slice = 0;
           for (i=0;i<this.user.email.length;i++){
               if (this.user.email[i] == '@'){
                  slice = i
               }
           }
           $('.user-email').text(this.user.email.slice(0,slice));
           $('.menu-crud').removeClass('hidden');
           $('.menu-loading').addClass('hidden');
           $('.btn-login').addClass('hidden');
           $('.menu-user').removeClass('hidden');
           $('.menu-list').addClass("active");
           this.router.navigate('list', {trigger: true});
        },
        showList: function() {
            if (category === 1){
                var $listTemplate = getTemplate('tpl-thesis-list');
                $('.app-content').html($listTemplate);
            } else {
                var $listTemplate = getTemplate('tpl-thesis-list2');
                $('.app-content').html($listTemplate);
            }
        },
        search: function(query, callback) {
            $.get('/api/search/?q=' + query, {
                returned_fields: JSON.stringify(['Title', 'Year'])
            }, function(list) {
                callback(list);
            });
        },
        getThesisByID: function(id, callback) {
            var object = {};
            $.get('/api/thesis/' + id, function(item) {
                callback(item);
            });
        },
        showThesis: function(thesis) {
            var self = this;
            var $viewTemplate = getTemplate('tpl-thesis-detail', thesis);
            $('.app-content').html($viewTemplate);
        },
        showForm: function(object) {
            var self = this;
            if (!object) {
                object = {};
            }
            var $formTemplate = getTemplate('tpl-thesis-form', object);
            $('.app-content').html($formTemplate);
            $('form').unbind('submit').submit(function(ev) {
                var thesisObject = {};
                var inputs = $('form').serializeArray();
                for (var i = 0; i < inputs.length; i++) {
                    thesisObject[inputs[i].name] = inputs[i].value;
                }
                self.save(thesisObject);
                return false;
            });
            $('.btn-cancel').click(function() {
                self.router.navigate('list', {trigger: true});
                $('.menu-list').addClass("active");
                return false;
            });
            self.setEventListeners();
        },
        loadAllThesis: function() {
            var self = this;
            setTimeout(function() {
                $.get('/api/thesis', function(res) {
                    self.displayLoadedList(res);
                });
            }, 200);
        },
        displayLoadedList: function(list) {
            var self = this;
            if (list.length === 0) {
                $('.app-content').html("There are no thesis files at the moment.");
            } else {

                _.each(list, function(item) {
                    if (category === 1){
                        var $thesisItem = $(getTemplate('tpl-thesis-list-item', item));
                    } else {
                        if (item.owners[0] == self.user.Id){
                            var $thesisItem = $(getTemplate('tpl-thesis-list-item2', item));
                        }
                    }
                    var id = item.Id
                    if (item.Key) {
                        id = item.Key;
                    }
                    $thesisItem.find('.btn-edit').click(function() {
                        self.router.navigate('edit-' + id, {trigger: true});
                    });
                    $thesisItem.find('.btn-view').click(function() {
                        self.router.navigate('thesis-' + id, {trigger: true});
                    });
                    $thesisItem.find('.btn-delete').click(function() {
                        self.router.navigate('delete-' + id, {trigger: true});
                    });
                    $('.thesis-list').append($thesisItem);
                });
            }
        },
        save: function(object) {
            var self = this;

            var thesisObject = {};
            var inputs = $('form').serializeArray();
            for (var i = 0; i < inputs.length; i++) 
            {
                thesisObject[inputs[i].name] = inputs[i].value;
            }
            if (thesisObject.Title.length != 0 && thesisObject.Description.length != 0)
            { 
                $.post('api/thesis', object, function(res) {
                self.router.navigate('list', {trigger: true});
                $('.menu-list').addClass("active");
                $('.menu-create').removeClass("active");
                $('.col-md-7').html('<em>A thesis was created/modified.</em>'+$('.col-md-7').html());
                });
                return false;
            }
            else
            {
                $('#new-thesis-form').html($('#new-thesis-form').html()+ '<em>Please fill up the required fields(*).</em>');
            }           
        },
        deleteThesis: function(id){
            var self = this;
            $.ajax({
                type: 'DELETE',
                url: '/api/thesis/' + id,
                success: function() {
                    self.router.navigate('list', {trigger: true});
                }
            });
        },
        searchThesis: function(keyword){
            var self = this;
            var regexStatement = new RegExp(".*(" + keyword + ").*", "i");
            $.get('/api/thesis', function(obj){
               var sorted_list = $.grep(obj, function(thesis, index){
                    return regexStatement.test(thesis.Title);
               });
               if(sorted_list.length == 0){
                    $('.app-content').html('<em>Your search does not have any match.</em>');
               }
               else{
                    var $listTemplate = getTemplate('tpl-thesis-list');
                    $('.app-content').html($listTemplate);
                    _.each(sorted_list, function(item) {
                        var $thesisItem = $(getTemplate('tpl-thesis-list-item', item));
                        $('.thesis-list').append($thesisItem);
                        var id = item.Id
                        if (item.Key) {
                            id = item.Key;
                        }
                        $thesisItem.find('.btn-edit').click(function() {
                            self.router.navigate('edit-' + id, {trigger: true});
                        });
                        $thesisItem.find('.btn-view').click(function() {
                            self.router.navigate('thesis-' + id, {trigger: true});
                        });
                        $thesisItem.find('.btn-delete').click(function() {
                            self.router.navigate('delete-' + id, {trigger: true});
                        });
                    });
               }
               $('.search-input').val('');
            });
        }
    };
    function getTemplate(template_id, context) {
        var template, $template, markup;
        template = $('#' + template_id);
        $template = Handlebars.compile(template.html());
        markup = $template(context);
        return markup;
    }
    var Router = Backbone.Router.extend({
        routes: {
            '': 'onHome',
            'search?=:query': 'onSearch',
            'thesis-:id': 'onView',
            'new': 'onCreate',
            'edit-:id': 'onEdit',
            'list': 'onList',
            'list2': 'onList',
            'delete-:id': 'onDelete'
       },
       onSearch: function(query) {
            app.searchThesis(query);
       },
       onView: function(id) {
            $('.menu-list').removeClass("active");
            app.getThesisByID(id, function(item) {
                app.showThesis(item);
                FB.XFBML.parse();
            });
       },
       onCreate: function() {
            app.showForm();
       },
       onEdit: function(id) {
            $('.menu-list').removeClass("active");
            app.getThesisByID(id, function(item) {
                app.showForm(item);
            });
       },
       onList: function() {
            app.showList();
            app.loadAllThesis();
       },
       onDelete: function(id) {
            app.deleteThesis(id);
       },

    });
    app.init();
});
