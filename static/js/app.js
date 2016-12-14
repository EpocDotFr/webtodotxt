function todoToString(todo) {
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
    delimiters: ['${', '}'], // Because Jinja2 already uses double brakets
    el: '#app',
    data: {
        valid_priorities: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
        loading: false, // Something is loading

        // Todo creation/edition
        todoBeingEdited: null,

        todos: [], // List of all todos straight from the Todo.txt

        // Filters used to filter the todo list above
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
    mounted: function () {
        this.$nextTick(function () {
            app.loadTodoTxt(); // Load the Todo.txt file
        });
    },
    directives: {
        'date-filter-datepicker': {
            inserted: function (el, binding) {
                new Pikaday({
                    firstDay: FIRST_DAY_OF_WEEK,
                    format: 'L', // Short date format
                    i18n: PIKADAY_LOCALE,
                    field: el,
                    onSelect: function() {
                        app.filters[binding.arg] = this.getMoment(); // Update the appropriate filter
                    }
                });
            },
            update: function(el, binding) { // FIXME this hook is fired more times than necessary for EACH directives when filter value change
                if (!app.filters[binding.arg]) { // Filter has been reinitialized
                    // TODO set Pikaday date to null using instance.setDate(null)
                    el.value = '';
                }
            }
        }
    },
    computed: {
        // The todo list, filtered according criteria
        filteredTodos: function () {
            return this.todos.filter(function (todo) {
                var text = completed = completion_date = priority = creation_date = projects = contexts = due_date = true;

                if (('text' in todo) && app.filters.text) {
                    text = todo.text.toLowerCase().indexOf(app.filters.text.toLowerCase()) !== -1;
                }

                if (app.filters.completed == 'yes') {
                    completed = ('completed' in todo) && todo.completed;
                } else if (app.filters.completed == 'no') {
                    completed = ('completed' in todo) && !todo.completed;
                }

                if (app.filters.completion_date) {
                    completion_date = ('completion_date' in todo) && todo.completion_date && app.filters.completion_date.isSame(todo.completion_date, 'day');
                }

                if (app.filters.priorities && app.filters.priorities.length > 0) {
                    priority = ('priority' in todo) && todo.priority && $.inArray(todo.priority, app.filters.priorities) !== -1;
                }

                if (app.filters.creation_date) {
                    creation_date = ('creation_date' in todo) && todo.creation_date && app.filters.creation_date.isSame(todo.creation_date, 'day');
                }

                if (app.filters.projects && app.filters.projects.length > 0) {
                    projects = ('projects' in todo) && todo.projects && $.grep(todo.projects, function(project) {
                        return $.inArray(project, app.filters.projects) !== -1;
                    }).length > 0;
                }

                if (app.filters.contexts && app.filters.contexts.length > 0) {
                    contexts = ('contexts' in todo) && todo.contexts && $.grep(todo.contexts, function(context) {
                        return $.inArray(context, app.filters.contexts) !== -1;
                    }).length > 0;
                }

                if (app.filters.due_date) {
                    due_date = ('due' in todo.tags) && todo.tags.due && app.filters.due_date.isSame(todo.tags.due, 'day');
                }

                return text && completed && completion_date && priority && creation_date && projects && contexts && due_date;
            }).sort(function(first_todo, second_todo) {
                if (('_new' in first_todo)) { // New todo always on top of all others
                    return -1;
                }

                first_todo = todoToString(first_todo);
                second_todo = todoToString(second_todo);

                return first_todo.localeCompare(second_todo);
            });
        },
        // All priorities extracted from the current todo list
        allPriorities: function() {
            var all_priorities = [];

            $.each(this.todos, function(index, todo) {
                if (!('priority' in todo) || !todo.priority || $.inArray(todo.priority, all_priorities) !== -1) {
                    return null;
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
            var all_projects = this.currentProjects;
            var stored_projects = this.storedProjects;

            $.each(stored_projects, function(index, project) { // Merge the stored projects in the current ones
                if ($.inArray(project, all_projects) !== -1) {
                    return;
                }

                all_projects.push(project);

                if ($.inArray(project, stored_projects) === -1) {
                    stored_projects.push(project);
                }
            });

            all_projects = all_projects.sort();

            this.storedProjects = all_projects;

            return all_projects;
        },
        // All projects stored in the localStorage
        storedProjects: {
            get: function () {
                return JSON.parse(localStorage.getItem('projects')) || [];
            },
            set: function (projects) {
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
            var all_contexts = this.currentContexts;
            var stored_contexts = this.storedContexts;

            $.each(stored_contexts, function(index, context) { // Merge the stored contexts in the current ones
                if ($.inArray(context, all_contexts) !== -1) {
                    return;
                }

                all_contexts.push(context);

                if ($.inArray(context, stored_contexts) === -1) {
                    stored_contexts.push(context);
                }
            });

            all_contexts = all_contexts.sort();

            this.storedContexts = all_contexts;

            return all_contexts;
        },
        // All contexts stored in the localStorage
        storedContexts: {
            get: function () {
                return JSON.parse(localStorage.getItem('contexts')) || [];
            },
            set: function (contexts) {
                localStorage.setItem('contexts', JSON.stringify(contexts));
            }
        }
    },
    methods: {
        // Filters
        clearGeneralFilters: function() {
            this.filters.completed = 'all';
            this.filters.text = '';
            this.filters.completion_date = '';
            this.filters.creation_date = '';
            this.filters.due_date = '';
        },
        clearAllFilters: function() {
            this.clearGeneralFilters();

            this.filters.priorities = [];
            this.filters.projects = [];
            this.filters.contexts = [];
        },
        // Todo creation
        addTodo: function() {
            if (this.todoBeingEdited) {
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
            this.todoBeingEdited = new_todo;
        },
        // Todo edition
        editTodo: function (todo) {
            if (this.todoBeingEdited) {
                return;
            }

            this.todoBeingEdited = todo;
        },
        // Called when todo modification is done
        doneEditTodo: function (todo) {
            if (!this.todoBeingEdited) {
                return;
            }

            this.todoBeingEdited = null;

            if ('_new' in todo) {
                Vue.delete(todo, '_new');
            }

            if (!todo.text) {
                this.removeTodo(todo);
            }
        },
        // Called when a todo completion status is set
        todoCompletedHook: function(todo) {
            if (todo.completed) {
                todo.completion_date = moment();
            } else {
                todo.completion_date = '';
            }
        },
        // Add a new project to a todo
        addProjectToTodo: function(todo, event) {
            var project_name = $.trim(event.target.value);

            if (!project_name) {
                return;
            }
            
            todo.projects.push(project_name);

            event.target.value = '';
        },
        // Add a new context to a todo
        addContextToTodo: function(todo, event) {
            var context_name = $.trim(event.target.value);

            if (!context_name) {
                return;
            }

            todo.contexts.push(context_name);

            event.target.value = '';
        },
        removeDueDate: function(todo) {
            Vue.delete(todo.tags, 'due');
        },
        // Load all todos from the Todo.txt file in the Vue.js data
        loadTodoTxt: function() {
            this.loading = true;

            $.ajax({
                type: 'GET',
                url: ROOT_URL + 'todo.txt',
                dataType: 'json',
                cache: false,
                success: function(response, status, xhr) {
                    if (response.status == 'success') {
                        app.todos = $.map(response.data, function(todo) {
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
                    app.loading = false;
                }
            });
        },
        // Save all todos in the Todo.txt file from the Vue.js data
        saveTodoTxt: function() {
            this.loading = true;

            var data = $.map($.extend(true, {}, app.todos), function(todo) {
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
                    app.loading = false;
                }
            });
        }
    }
});
