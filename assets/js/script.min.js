Vue.use(VueMasonry)
Vue.use(VueClazyLoad)

Vue.component('blog-post', {
  props: ['post'],
  template: `
    <div class="blog-post">
      <h3>{{ data.title }}</h3>
      <div v-html="data.content"></div>
    </div>
  `
})

Vue.component('pithy-template', {
    props: ['data'],
    template: '#tmpl-pithy-template',
    methods: {
        showPreview() {
            this.$emit('preview', this.data.id)
        }
    }
})

var app = new Vue({
    el: '.wrap',
    data: {
      page: 1,
      templates: [],
      template: {
        title: {},
      },
      loading: true,
      preview: false,
      picked: 'template',
      importForm: false,
      expanded: true,
      deviceClass: 'preview-desktop',
      installedPlugins: pithy_templates.installed_plugins,
      activePlugins: pithy_templates.active_plugins,
    },
    computed: {
      importActive: function() {
        var self = this
        var state = true

        if ( typeof this.template.plugins == 'undefined' ) {
          return
        }

        this.template.plugins.map(function(plugin) {
          if (self.activePlugins.indexOf(plugin.slug) > -1) {
            return
          }

          state = false
        })

        return state
      }
    },
    methods: {
        infiniteHandler($state) {
          axios.get('https://pithywp.ir/wp-json/pithywp/v1/templates/', {
            params: {
              page: this.page,
            },
          })
            .then(({ data }) => {
              if (data.length) {
                this.page += 1;
                this.templates.push(...data);
                $state.loaded();
              } else {
                $state.complete();
              }
            })
            .catch( function(response) {
              $state.error();
            })
        },
        togglePreview (event) {
          if (!this.preview) {
            id = Number.isInteger(event) ? event : null

            if (id) {
              this.template = this.templates.find(template => template.id === id)
            }
          } else {
            this.template = {
              title: {},
            }
          }

          var display = this.preview ? 'none' : 'block'
          this.$refs.previewOverlay.style.display = display
          this.preview = !this.preview
          document.getElementsByClassName('pithy-import-feedback')[0].innerHTML = '';
        },
        installPlugin (plugin) {
          var self = this
          var button = event.target

          button.classList.add('updating-message')

          var args = {
            slug: plugin.split('/')[0],
            success: function(response) {
              button.classList.remove('updating-message')
              self.installedPlugins.push(plugin)
            },
            error: function(response) {
              console.log(response)
            }
          }

          wp.updates.installPlugin(args)
        },
        activatePlugin (plugin) {
          var self = this
          var button = event.target
          var params = new URLSearchParams();

          button.classList.add('updating-message')

          params.append('nonce', pithy_templates.nonce);
          params.append('action', 'pithy_templates');
          params.append('type', 'activate_plugin');
          params.append('plugin', plugin);

          button.classList.add('updating-message')

          axios
            .post(ajaxurl, params)
            .then(response => {
              button.classList.remove('updating-message')

              if ( false == response.data.success ) {
                console.log(response.data)
                return;
              }

              self.activePlugins.push(plugin)
            })
            .catch(function (error) {
              console.log(error);
            })
        },
        isPluginInstalled: function (plugin) {
          return this.installedPlugins.indexOf(plugin) > -1;
        },
        isPluginActive: function (plugin) {
          return this.activePlugins.indexOf(plugin) > -1;
        },
        importTemplate: function(templateId) {
          var button = event.target
          var feedback = document.getElementsByClassName('pithy-import-feedback')[0]
          var params = new URLSearchParams();

          params.append('nonce', pithy_templates.nonce);
          params.append('action', 'pithy_templates');
          params.append('type', 'import_template');
          params.append('template_id', templateId);

          button.classList.add('updating-message')

          axios
            .post(ajaxurl, params)
            .then(response => {
              console.log(response)
              button.classList.remove('updating-message')

              if ( false == response.data.success ) {
                feedback.innerHTML = 'Error: Check browser console';
                console.log(response.data)
                return;
              }

              var data = response.data.data[0]

              feedback.innerHTML = 'Imported <a href="' + data.url + '" target="_blank">' + data.title + '</a> in <a href="' + pithy_templates.elementor_save_templates_url + '" target="_blank">Saved Templates</a>.'
            })
            .catch(function (error) {
              console.log(error);
            })
        }
    }
})
