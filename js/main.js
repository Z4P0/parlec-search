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

(function (window, document, undefined) {
    'use strict';

    /**
     * This file handles the parts search things.
     * init:
     *     1 - get JSON data
     *         store it to the parlec.DATA object
     *             for now it will b the only data attached to it. if in the
     *             future we want to add other things we will modify thie
     *             structure of this object
     *     2 - add event listeners to:
     *         select boxes - navigate the data by making selections
     *         text input - find a part by part number input
     *     --
     *     3 - TO DO
     *         save to email somehow
     */


    parlec.modules['parts-search'] = {


        name: 'parts-search',

        tag: 'P A R L E C   P A R T S   S E A R C H',


        settings: {

            product_families: {
                'Toolholding': {
                    json_url: 'data/parlec-toolholding.json'
                }
            }

        },

        config: {},  // will hold our search settings: product_solution, system, taper type

        data: {},  // will hold our own malleable copy of data - maybe

        results: {},  // will hold our final products after searching

        setup_incomplete: true,


        get_json_data: function (product_family, callback) {

            /**
             * product_family must be a 'name' from one of the product_families.
             * the name will be directly translated as the id of the data
             *
             * this completes this initializatio process
             */

            var self = this;

            $.getJSON(self.settings.product_families[product_family].json_url, function (data) {


                // overwrite previous data if it already exists
                var saved_data_already_exists = false,
                    data_point;

                var products_array = parlec.DATA[self.name].products;


                // check if pre-existing data already exists
                for (var i = 0; i < products_array.length; i++) {
                    if (products_array[i].name === product_family) {
                        saved_data_already_exists = true;
                        data_point = products_array[i];
                    }
                }

                if (saved_data_already_exists) {
                    data_point.products = data;
                } else {
                    products_array.push({
                        name: product_family,
                        products: data
                    })
                }

                // update our local data object
                self.data = parlec.DATA[self.name];


                if (self.setup_incomplete) {
                    self.complete_initial_setup();  // sets setup_incomplete = false
                }

                if (callback) callback();

            });

        },


        remove_disabled_attribute_from: function (array_of_DOM_nodes) {
            $.each(array_of_DOM_nodes, function (i, ele) {
                $(ele).attr('disabled', false);
            })
        },


        render_next_options: function (settings) {

            // load up that data point
            var data_point = this.data.products[this.config.product_solution.index].products;

            // read the config object and render the results
            // ----------------------------------------

            var results = [];

            if (
                this.config.system !== undefined ||
                this.config.taper_type !== undefined ||
                this.config.part_number !== undefined
            ) {
                for (var i = 0; i < data_point.length; i++) {
                    // for every product, check if it matches our current config
                    var product = data_point[i];
                    var system_match        = true;
                    var taper_type_match    = true;
                    var part_number_match   = true;

                    // check system
                    if (this.config.system !== undefined) {
                        if (product['SYSTEM'] !== this.config.system.name) {
                            system_match = false;
                        }
                    }
                    // check taper type
                    if (this.config.taper_type !== undefined) {
                        if (product['TAPER TYPE'] !== this.config.taper_type.name) {
                            taper_type_match = false;
                        }
                    }

                    // check part number
                    if (this.config.part_number !== undefined) {
                        if (product['PART NUMBER'] !== this.config.part_number.name) {
                            part_number_match = false;
                        }
                    }

                    if (system_match && taper_type_match && part_number_match) {
                        results.push(product);
                    }
                }


            } else {
                results = data_point;
            }


            // filter duplicates
            // ----------------------------------------
            var filtered_results = [];
            for (var j = 0; j < results.length; j++) {

                if (filtered_results.length) {
                    var already_exists = false;

                    for (var k = 0; k < filtered_results.length; k++) {
                        if (filtered_results[k].name === results[j][settings.field]) {
                            already_exists = true;
                        }
                    }
                    if (!already_exists) {
                        filtered_results.push({
                            name: results[j][settings.field],
                            product: results[j]
                        });
                    }
                } else {
                    filtered_results.push({
                        name: results[j][settings.field],
                        product: results[j]
                    });
                }

            }


            var $target = $(settings.target);

            if (filtered_results.length) {
                // render the options
                parlec.utils.render_template({
                    target: settings.target,
                    template: '#option-tpl',
                    context: {
                        options: filtered_results
                    }
                });

                this.results = filtered_results;
                // removed "disabled" attribute
                if ($target.attr('disabled')) {$target.attr('disabled', false); }
            } else {
                alert('Sorry! No results found. Try modifying your search.');
                $target.attr('disabled', true);
            }

        },


        add_event_listeners: function () {

            var self = this;

            // a) select boxes
            // ----------------------------------------
            //      update config object
            //      render new options
            $('#product-solution').on('change', function (event) {

                var $option = $(event.target).find('option:selected');
                self.config.product_solution = {
                    name: $option.val(),
                    index: $option.data('index')
                }
                self.render_next_options({
                    target: '#system',
                    field: 'SYSTEM'
                });

            });



            $('#system').on('change', function (event) {

                var $option = $(event.target).find('option:selected');
                self.config.system = {
                    name: $option.val(),
                    index: $option.data('index')
                }
                // console.log(self.config.system);
                self.render_next_options({
                    target: '#taper-type',
                    field: 'TAPER TYPE'
                });

            });



            $('#taper-type').on('change', function (event) {

                var $option = $(event.target).find('option:selected');
                self.config.taper_type = {
                    name: $option.val(),
                    index: $option.data('index')
                }
                self.render_next_options({
                    target: '#part-number-select',
                    field: 'PART NUMBER'
                });

            });




            $('#part-number-select').on('change', function (event) {
                // var $selected_option = $(event.target).find('option:selected');

                var option = $(event.target).find('option:selected').data('index');

                self.render_product(self.results[option].product);
            });





            // b) text input
            // ----------------------------------------
            var $part_number_input = $('#part-number');

            $part_number_input.on('keyup', function (event) {

                var trimmed_input = $part_number_input.val().trim();
                if (trimmed_input !== '') {
                    self.search_for_part_number(trimmed_input);
                }

            });

        },




        render_product: function (product) {

            // TEMPORARY HACK - add a default image
            if (product.image === undefined) {
                product.image = '/images/product-image-1.jpg';
            }


            // we have to sanitize the data a bit.
            // the object has spacees that we underscore:
            // "TAPER TYPE" --> taper_type
            // without this, Handlebars cannot render properly
            //      should we be doing this earlier? like when we first load
            //      up the data?. we'd probably have to update some code to
            //      handle the new structure

            var underscored_product = {};
            for(var field in product) {
                underscored_product[s.underscored(field)] = product[field];
            }


            parlec.utils.render_template({
                target: '#results',
                template: '#results-tpl',
                context: {
                    data: underscored_product
                }
            });

            $(document).foundation('tab', 'reflow');

        },



        init: function() {

            // if we are on the parts-search page, inititiliaze the JS
            if (!$('#parts-search').length) return;


            // 0 - create our data point
            parlec.DATA[this.name] = {
                name: this.tag,
                products: []
            };


            // 1 - get json data for each product family,
            //      each product family is an object appended to the products []
            function render_product_solution_options() {
                // update the product-family <select>
                parlec.utils.render_template({
                    target: '#product-solution',
                    template: '#option-tpl',
                    context: {
                        options: parlec.DATA[self.name].products
                    }
                });

            }

            for (var product_family in this.settings.product_families) {
                var self = this;
                this.get_json_data(product_family, render_product_solution_options);
            }


            // 2 -
            this.add_event_listeners();


            // wait until we have data to enable everything
            if (parlec.DATA[this.name].products.length) {
                this.complete_initial_setup();
            }

            // 3 - setup joyride
            $(document).foundation('joyride', 'start');
        },


        complete_initial_setup: function () {

            this.remove_disabled_attribute_from([
                $('#product-solution'),
                $('#part-number')
            ]);

            $('#product-solution').attr('data-root', true);

            this.setup_incomplete = false;

        },






        search_for_part_number: function (user_input) {

            console.log(user_input);

            // loop through all the products
            for (var i = 0; i < parlec.DATA[this.name].products.length; i++) {

                var product_family = parlec.DATA[this.name].products[i].products;

                for (var j = 0; j < product_family.length; j++) {

                    if (product_family[j]['PART NUMBER'] == user_input) {
                        console.log('match');
                        console.log(product_family[j]);
                    }
                }

            }

        },









        update_1: function (event) {

            /**
             * this function updates our data_point and selectbox references
             * and then calls render() to show the latest data
             */

            // hard reset if we interact with the first box
            if (event.target.getAttribute('data-root')) this.reset_search();

            // get data about the selection the user just made
            var select_box_index = parseInt(event.target.getAttribute('data-select-index'), 10),
                index = parseInt(event.target.selectedOptions[0].getAttribute('data-index'), 10);


            // we update our data_point and select_box references
            // ----------------------------------------
            if (select_box_index === this.current.select_box_index) {
              // we clicked on the last selectbox, so we are progressing through the data
              // move to our new data point, and select_box reference
              this.current.data_point = this.current.data_point.products[index];
              this.current.select_box_index++;
              // add index choice to our history
              this.current.history.push(index);
            } else if (select_box_index < this.current.select_box_index) {
              // we clicked on a previous box, so we want to go back from where we came
              // we have to re-navigate the data to get to a previous point, for this
              // reason we have temporary (tmp_) variables
              var layer_difference = this.current.select_box_index - select_box_index,
                  tmp_data_point = this.data,
                  tmp_history = [];

              // move to our new data point, and select_box reference
              // we go through the history array (which has all our previous choices)
              // until we get to the level of data required
              for (var i = 0; i < this.current.history.length - layer_difference; i++) {
                tmp_data_point = tmp_data_point.products[this.current.history[i]];
                tmp_history.push(this.current.history[i]);
              }
              // add our latest choice to our new history
              tmp_history.push(index);
              // finally.. update our data_point and history
              this.current.data_point = tmp_data_point.products[index];
              this.current.history = tmp_history;

              // update our select_box_index
              this.current.select_box_index = select_box_index + 1;
              // this doesn't mke sense initially, i should probably take another look

            }

            console.log(this.current.data_point, this.current.select_box_index);

            // render the things, either the next box or results table
            // ----------------------------------------
            this.render();
          }


    };


}(window, window.document));

//# sourceMappingURL=main.js.map
