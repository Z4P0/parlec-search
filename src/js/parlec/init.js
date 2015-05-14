(function (window, document, undefined) {
    'use strict';


    window.parlec = {


        tag: 'P A R L E C',

        DATA: {},  // empty object we can populate after requesting JSON

        modules: {},  // empty object we can attach cusomt objects to


        init: function() {
            console.log(this.tag);

            // initialize all modules
            for (var module in this.modules) {
                this.modules[module].init();
            }

        },


        utils: {
            render_template: function(settings) {
                /**
                 * Dependencies: Handlebar.js, jQuery.js
                 *
                 * settings = {
                 *   template: '#script-id',
                 *   target: '#query-string',
                 *   context: {},
                 *   append: boolean (optional),
                 *   prepend: boolean (optional)
                 * }
                 */
                // get Handlebar template
                if (!settings.template || settings.template ==='') {
                  $(settings.target).html(''); // if template is empty, clear HTML of target
                  return;
                }
                var template = Handlebars.compile($(settings.template).html());

                // render it (check it we have a context)
                var html = template( settings.context ? settings.context : {} );

                if (settings.append) $(settings.target).append(html);
                else if (settings.prepend) $(settings.target).prepend(html);
                else $(settings.target).html(html);
            }

        }

    };


    $(document).ready(function () {
        $(document).foundation();
        parlec.init();
    });


}(window, window.document));
