function isLocalStorageSupported() {
    try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        return true;
    } catch(e) {
        return false;
    }
}

function getTodoStringForSorting(todo) {
    ret = [];

    if ('completed' in todo && todo.completed) {
        ret.push('x');
    }

    if ('priority' in todo && todo.priority) {
        ret.push('(' + todo.priority + ')');
    }

    ret.push(todo.text);

    return ret.join(' ');
}

var app = new Vue({
    delimiters: ['${', '}'], // Because Jinja2 already uses double brackets
    el: '#app',
    data: {
        // --------------------------------------------------------
        // Constants

        valid_priorities: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
        humanize_data_timespan: 3, // If the todo dates are within -3 or +3 days from today: convert dates to relative ones
        due_date_highlight_timespan: 1, // Highlight the due date of a todo if it is for tomorrow or earlier
        is_local_storage_supported: false,

        // --------------------------------------------------------
        // Variables

        loading: false, // Network activity indicator
        is_dirty: false, // Did the user made changes and didn't saved them?
        todo_being_edited: null, // The todo that is being edited (also used when creating a new todo)
        todos: [], // The list of all todos

        // Criteria used to filter the todo list above
        filters: {
            completed: 'all',
            text: '',
            completion_date: '',
            creation_date: '',
            due_date: '',
            priorities: [],
            projects: [],
            contexts: []
        }
    },
    // When Vue is ready
    mounted: function() {
        var self = this;

        window.addEventListener('beforeunload', function(e) {
            if (!self.is_dirty) {
                return undefined;
            }

            (e || window.event).returnValue = LOCALES.dirty_state_message;
            return LOCALES.dirty_state_message;
        });

        this.is_local_storage_supported = isLocalStorageSupported();

        // Load stored filters values and merge them
        if (this.is_local_storage_supported) {
            stored_filters = JSON.parse(localStorage.getItem('filters')) || {};
            $.extend(this.filters, stored_filters);
        }

        this.$nextTick(function() {
            self.loadTodoTxt(); // Load the Todo.txt file
        });
    },
    directives: {
        // Datepicker on the date fields in filters
        'date-filter-datepicker': {
            inserted: function(el, binding) {
                new Pikaday({
                    firstDay: FIRST_DAY_OF_WEEK,
                    format: 'L', // Short date format
                    i18n: LOCALES.pikaday,
                    field: el,
                    onSelect: function() {
                        app.filters[binding.arg] = this.getMoment(); // Update the filter accordingly
                    }
                });
            },
            update: function(el, binding) { // FIXME this hook is fired more times than necessary for EACH directives when the filter value change, which is counter-performant
                if (!app.filters[binding.arg]) { // Filter has been reinitialized
                    // TODO set Pikaday date to null using instance.setDate(null)
                    el.value = '';
                }
            }
        }
    },
    computed: {
        // The todo list, filtered according criteria
        filteredTodos: function() {
            var self = this;

            return this.todos.filter(function(todo) {
                var text = completed = completion_date = priority = creation_date = projects = contexts = due_date = true;

                if (('text' in todo) && self.filters.text) {
                    text = todo.text.toLowerCase().indexOf(self.filters.text.toLowerCase()) !== -1;
                }

                if (self.filters.completed == 'yes') {
                    completed = ('completed' in todo) && todo.completed;
                } else if (self.filters.completed == 'no') {
                    completed = ('completed' in todo) && !todo.completed;
                }

                if (self.filters.completion_date) {
                    completion_date = ('completion_date' in todo) && todo.completion_date && self.filters.completion_date.isSame(todo.completion_date, 'day');
                }

                if (self.filters.priorities && self.filters.priorities.length > 0) {
                    priority = ('priority' in todo) && todo.priority && $.inArray(todo.priority, self.filters.priorities) !== -1;
                }

                if (self.filters.creation_date) {
                    creation_date = ('creation_date' in todo) && todo.creation_date && self.filters.creation_date.isSame(todo.creation_date, 'day');
                }

                if (self.filters.projects && self.filters.projects.length > 0) {
                    projects = ('projects' in todo) && todo.projects && $.grep(todo.projects, function(project) {
                        return $.inArray(project, self.filters.projects) !== -1;
                    }).length > 0;
                }

                if (self.filters.contexts && self.filters.contexts.length > 0) {
                    contexts = ('contexts' in todo) && todo.contexts && $.grep(todo.contexts, function(context) {
                        return $.inArray(context, self.filters.contexts) !== -1;
                    }).length > 0;
                }

                if (self.filters.due_date) {
                    due_date = ('due' in todo.tags) && todo.tags.due && self.filters.due_date.isSame(todo.tags.due, 'day');
                }

                return text && completed && completion_date && priority && creation_date && projects && contexts && due_date;
            }).sort(function(first_todo, second_todo) {
                if (('_new' in first_todo)) { // New todo always on top of all others
                    return -1;
                }

                first_todo = getTodoStringForSorting(first_todo);
                second_todo = getTodoStringForSorting(second_todo);

                return first_todo.localeCompare(second_todo);
            });
        },
        // All priorities extracted from the current todo list
        allPriorities: function() {
            var all_priorities = [];

            $.each(this.todos, function(index, todo) {
                if (!('priority' in todo) || !todo.priority || $.inArray(todo.priority, all_priorities) !== -1) {
                    return;
                }

                all_priorities.push(todo.priority);
            });

            return all_priorities.sort();
        },
        // All projects extracted from the current todo list
        currentProjects: function() {
            var current_projects = [];

            $.each(this.todos, function(index, todo) {
                if (!('projects' in todo) || !todo.projects) {
                    return;
                }

                $.each(todo.projects, function(index, project) {
                    if ($.inArray(project, current_projects) !== -1) {
                        return;
                    }

                    current_projects.push(project);
                });
            });

            return current_projects.sort();
        },
        // Sum of all projects in the current todo list and the ones stored in the localStorage
        allProjects: function() {
            var all_projects = $.extend(true, [], this.currentProjects);

            if (this.is_local_storage_supported) {
                $.each(this.storedProjects, function(index, project) { // Merge the stored projects in the current ones
                    if ($.inArray(project, all_projects) !== -1) {
                        return;
                    }

                    all_projects.push(project);
                });
            }

            all_projects = all_projects.sort();

            if (this.is_local_storage_supported) {
                this.storedProjects = all_projects;
            }

            return all_projects;
        },
        // All projects stored in the localStorage
        storedProjects: {
            get: function() {
                return JSON.parse(localStorage.getItem('projects')) || [];
            },
            set: function(projects) {
                localStorage.setItem('projects', JSON.stringify(projects));
            }
        },
        // All contexts extracted from the current todo list
        currentContexts: function() {
            var current_contexts = [];

            $.each(this.todos, function(index, todo) {
                if (!('contexts' in todo) || !todo.contexts) {
                    return;
                }

                $.each(todo.contexts, function(index, context) {
                    if ($.inArray(context, current_contexts) !== -1) {
                        return;
                    }

                    current_contexts.push(context);
                });
            });

            return current_contexts.sort();
        },
        // Sum of all contexts in the current todo list and the ones stored in the localStorage
        allContexts: function() {
            var all_contexts = $.extend(true, [], this.currentContexts);

            if (this.is_local_storage_supported) {
                $.each(this.storedContexts, function(index, context) { // Merge the stored contexts in the current ones
                    if ($.inArray(context, all_contexts) !== -1) {
                        return;
                    }

                    all_contexts.push(context);
                });
            }

            all_contexts = all_contexts.sort();

            if (this.is_local_storage_supported) {
                this.storedContexts = all_contexts;
            }

            return all_contexts;
        },
        // All contexts stored in the localStorage
        storedContexts: {
            get: function() {
                return JSON.parse(localStorage.getItem('contexts')) || [];
            },
            set: function(contexts) {
                localStorage.setItem('contexts', JSON.stringify(contexts));
            }
        }
    },
    watch: {
        filters: {
            deep: true,
            handler: function(filters) {
                localStorage.setItem('filters', JSON.stringify(filters));
            }
        },
        is_dirty: function(is_dirty) {
            if (is_dirty) {
                document.title = '* ' + TITLE;
            } else {
                document.title = TITLE;
            }
        }
    },
    methods: {
        // Clear general filters
        clearGeneralFilters: function() {
            this.filters.completed = 'all';
            this.filters.text = '';
            this.filters.completion_date = '';
            this.filters.creation_date = '';
            this.filters.due_date = '';
        },
        // Clear all filters
        clearAllFilters: function() {
            this.clearGeneralFilters();

            this.filters.priorities = [];
            this.filters.projects = [];
            this.filters.contexts = [];
        },
        isStoredProjectOnly: function(project) {
            if (!this.is_local_storage_supported) {
                return false;
            }

            return $.inArray(project, this.currentProjects) === -1 && $.inArray(project, this.storedProjects) !== -1;
        },
        isStoredContextOnly: function(context) {
            if (!this.is_local_storage_supported) {
                return false;
            }

            return $.inArray(context, this.currentContexts) === -1 && $.inArray(context, this.storedContexts) !== -1;
        },
        removeStoredProject: function(project) {
            var stored_projects = $.extend(true, [], this.storedProjects);

            stored_projects.splice(stored_projects.indexOf(project), 1);

            this.storedProjects = stored_projects;
        },
        removeStoredContext: function(context) {
            var stored_contexts = $.extend(true, [], this.storedContexts);

            stored_contexts.splice(stored_contexts.indexOf(context), 1);

            this.storedContexts = stored_contexts;
        },
        // Create a new todo and make it the todo being edited
        addTodo: function() {
            if (this.todo_being_edited) { // A todo is already being edited
                return;
            }

            var new_todo = {
                text: '',
                completed: false,
                completion_date: null,
                priority: '',
                creation_date: moment(),
                projects: [],
                contexts: [],
                tags: {},
                _new: true
            };

            this.todos.unshift(new_todo);
            this.todo_being_edited = new_todo;
        },
        // Enter a todo in edit mode
        editTodo: function(todo) {
            if (this.todo_being_edited) {
                return;
            }

            this.todo_being_edited = todo;
        },
        // Called when todo edition is done
        doneEditTodo: function(todo) {
            if (!this.todo_being_edited || !todo.text) {
                return;
            }

            this.todo_being_edited = null;

            if ('_new' in todo) {
                Vue.delete(todo, '_new');
            }

            this.is_dirty = true;
        },
        // Called when a todo completion status is set
        todoCompletedHook: function(todo) {
            if (todo.completed) { // Todo was set as completed
                todo.completion_date = moment();
            } else {
                todo.completion_date = '';
            }

            this.is_dirty = true;
        },
        // Delete a todo
        deleteTodo: function(todo) {
            this.todos.splice(this.todos.indexOf(todo), 1);

            this.is_dirty = true;
        },
        // Add a new project to a todo
        addProjectToTodo: function(todo, event) {
            var project_name = $.trim(event.target.value);

            if (!project_name) {
                return;
            }

            todo.projects.push(project_name);

            event.target.value = '';

            this.is_dirty = true;
        },
        // Add a new context to a todo
        addContextToTodo: function(todo, event) {
            var context_name = $.trim(event.target.value);

            if (!context_name) {
                return;
            }

            todo.contexts.push(context_name);

            event.target.value = '';

            this.is_dirty = true;
        },
        // Remove the due date of a todo
        removeDueDate: function(todo) {
            Vue.delete(todo.tags, 'due');

            this.is_dirty = true;
        },
        // Load all todos from the Todo.txt file in the Vue.js data
        loadTodoTxt: function() {
            if (this.is_dirty && !confirm(LOCALES.dirty_state_message)) {
                return;
            }

            this.loading = true;
            var self = this;

            $.ajax({
                type: 'GET',
                url: ROOT_URL + 'todo.txt',
                dataType: 'json',
                cache: false,
                success: function(response, status, xhr) {
                    if (response.status == 'success') {
                        self.todos = $.map(response.data, function(todo) {
                            if (('completion_date' in todo) && todo.completion_date) {
                                todo.completion_date = moment(todo.completion_date);
                            }

                            if (('creation_date' in todo) && todo.creation_date) {
                                todo.creation_date = moment(todo.creation_date);
                            }

                            if (('due' in todo.tags) && todo.tags.due) {
                                todo.tags.due = moment(todo.tags.due);
                            }

                            return todo;
                        });

                        self.is_dirty = false;
                    } else {
                        alert(response.data.message);
                    }
                },
                error: function(xhr, errorType, error) {
                    try {
                        var response = JSON.parse(xhr.responseText);
                        message = response.data.message;
                    } catch (e) {
                        message = error;
                    }

                    alert(message);
                },
                complete: function() {
                    self.loading = false;
                }
            });
        },
        // Save all todos in the Todo.txt file from the Vue.js data
        saveTodoTxt: function() {
            this.loading = true;
            var self = this;

            var data = $.map($.extend(true, {}, this.todos), function(todo) {
                if (('completion_date' in todo) && moment.isMoment(todo.completion_date)) {
                    todo.completion_date = todo.completion_date.format('YYYY-MM-DD');
                }

                if (('creation_date' in todo) && moment.isMoment(todo.creation_date)) {
                    todo.creation_date = todo.creation_date.format('YYYY-MM-DD');
                }

                if (('due' in todo.tags) && moment.isMoment(todo.tags.due)) {
                    todo.tags.due = todo.tags.due.format('YYYY-MM-DD');
                }

                return todo;
            });

            $.ajax({
                type: 'POST',
                url: ROOT_URL + 'todo.txt',
                contentType: 'application/json',
                data: JSON.stringify(data),
                success: function(response, status, xhr) {
                    if (response.status != 'success') {
                        alert(response.data.message);
                    } else {
                        self.is_dirty = false;
                    }
                },
                error: function(xhr, errorType, error) {
                    try {
                        var response = JSON.parse(xhr.responseText);
                        message = response.data.message;
                    } catch (e) {
                        message = error;
                    }

                    alert(message);
                },
                complete: function() {
                    self.loading = false;
                }
            });
        },
        // Convert all text that looks like links/email addresses to HTML links
        autolinker: function(string) {
            return anchorme(string, {ips: false, files: false});
        },
        // Convert a date to a relative one if it is within -3 or +3 days from today
        humanizeDate: function(date) {
            var now = moment();
            var days_diff = date.diff(now, 'days');

            if (days_diff >= this.humanize_data_timespan || days_diff <= -this.humanize_data_timespan) {
                return date.format('L');
            } else {
                return date.from(now);
            }
        },
        // Determine if the due date of a todo is for tomorrow or earlier
        isDueDateImminent: function(due_date) {
            return due_date.diff(moment(), 'days') <= this.due_date_highlight_timespan;
        }
    }
});
