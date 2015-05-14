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
                    json_url: '/data/parlec-toolholding.json'
                }
            }

        },

        data: {},  // will hold our own malleable copy of data

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


        add_event_listeners: function () {


            // a) select boxes
            $('#product-solution').on('change', function (event) {
                var $selected_option = $(event.target).find('option:selected');
                console.log($selected_option.data('index'));
            });
            $('#system').on('change', function (event) {
                var $selected_option = $(event.target).find('option:selected');
                console.log($selected_option.data('index'));
            });
            $('#taper-type').on('change', function (event) {
                var $selected_option = $(event.target).find('option:selected');
                console.log($selected_option.data('index'));
            });
            $('#part-number-select').on('change', function (event) {
                var $selected_option = $(event.target).find('option:selected');
                console.log($selected_option.data('index'));
            });



            // b) text input
            var $part_number_input = $('#part-number');
            var self = this;

            $part_number_input.on('keyup', function (event) {

                var trimmed_input = $part_number_input.val().trim();
                if (trimmed_input !== '') {
                    self.search_for_part_number(trimmed_input);
                }

            });

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


            // we until we have data to enable everything
            if (parlec.DATA[this.name].products.length) {
                this.complete_initial_setup();
            }

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




























































parlec_product_search = {
  data: undefined,
  current: {
    data_point: undefined,
    select_boxes: [],
    select_box_index: 0,
    history: []
  },

  init: function (data) {

    // set the data parameter to our object, update our data_point object
    // data_point is our position in the data set
    // ----------------------------------------
    this.data = data;
    this.current.data_point = this.data;


    // setup event listener for onchange or something, add them to all
    // ----------------------------------------
    $('.select-box').each(function (index, element) {
      // add the index of the array, and onchange listener
      $(element).attr('data-select-index', index)
        .on('change', function (event) {
          parlec.product_search.update(event);
        });
      // if this is the first box, it is the 'root'
      // we reset search if we're messing with the root
      if (index === 0) $(element).attr('data-root', true);

      // push element to our array
      parlec.product_search.current.select_boxes.push(element);
    });


    // render the first box
    // ----------------------------------------
    parlec.utils.render_template({
      template: '#option-tpl',
      target: this.current.select_boxes[this.current.select_box_index],
      context: {options: this.current.data_point.products }
    });
    console.log(this.current.data_point, this.current.select_box_index);
    console.log('============================================');


    // ----------------------------------------
    // update() handles most of the things from here on out
    // ----------------------------------------

  },

  update: function (event) {

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
  },


  render: function () {
    // we reset HTML classes
    this.reset_classes();

    // add class ".active" to the active selectbox, remove "disabled" attribute
    $(this.current.select_boxes[this.current.select_box_index]).addClass('active').prop('disabled', false);

    // then render the next selectbox or a table
    this.render_selectbox();

    // if (this.current.data_point.products) this.render_selectbox();
    // else this.render_table();
  },


  reset_classes: function () {

    // make sure all the other boxes are reset
    // we start the loop at the current.select_box_index
    // lowest start point is 1 because 0 (this first box) will always be active
    var i = (this.current.select_box_index > 1) ? this.current.select_boxes[i] : 1;

    for (i; i < this.current.select_boxes.length; i++) {
      // remove class of "active", disabled = true
      $(this.current.select_boxes[i]).removeClass('active').prop('disabled', true);

      // clear the existing <options>
      parlec.utils.render_template({
        template: '#option-tpl',
        target: this.current.select_boxes[i],
        context: {options: undefined}
      });
    }

  },


  render_selectbox: function (options, target) {
    /**
     * this function takes a JSON object and outputs some HTML
     * the parameters are completely optional, by default it will use data from
     * the "current" object
     *
     * params:
     * options  |  JSON object
     * target   |  the <select> element we will populate
     */


    // render the products array in the next box
    parlec.utils.render_template({
      template: '#option-tpl',
      target: this.current.select_boxes[this.current.select_box_index],
      context: {options: this.current.data_point.products}
    });


  },


  render_table: function () {
    parlec.utils.render_template({
      template: '#results-tpl',
      target: '#results',
      context: {data: this.current.data_point}
    });
  },


  reset_search: function () {
    this.current.data_point = this.data;
    this.current.select_box_index = 0;
    this.current.history = [];
  }

}
