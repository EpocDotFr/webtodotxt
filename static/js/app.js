var app = new Vue({
    delimiters: ['${', '}'], // Because Jinja2 already uses double brakets
    el: '#app',
    data: {
        loading: false, // Something is loading

        // New todo creation
        todoTextBackup: null,
        todoBeingEdited: null,

        todos: [], // List of all todos straight from the Todo.txt
        filters: { // Filters used to filter the todo list above
            completed: 'all',
            text: '',
            completion_date: '',
            creation_date: '',
            priorities: [],
            projects: [],
            contexts: []
        },
    },
    // When Vue is ready
    mounted: function () {
        this.$nextTick(function () {
            app.loadTodoTxt();
        });
    },
    watch: {
        /*todos: function() {
            // https://vuejs.org/v2/guide/computed.html#Watchers
            // http://stackoverflow.com/questions/5226578/check-if-a-timeout-has-been-cleared
        }*/
    },
    computed: {
        // The todo list, filtered according filters
        filteredTodos: function () {
            return this.todos.filter(function (todo) {
                var text = completed = completion_date = priority = creation_date = projects = contexts = true;

                if (('text' in todo) && app.filters.text) {
                    text= todo.text.indexOf(app.filters.text) !== -1;
                }

                if (('completed' in todo) && app.filters.completed == 'yes') {
                    completed = todo.completed;
                } else if (('completed' in todo) && app.filters.completed == 'no') {
                    completed = !todo.completed;
                }

                if (('completion_date' in todo) && app.filters.completion_date) {
                    completion_date = app.filters.completion_date == todo.completion_date;
                }

                if (('priority' in todo) && app.filters.priorities && app.filters.priorities.length > 0) {
                    priority = $.inArray(todo.priority, app.filters.priorities) !== -1;
                }

                if (('creation_date' in todo) && app.filters.creation_date) {
                    creation_date = app.filters.creation_date == todo.creation_date;
                }

                if (('projects' in todo) && todo.projects && app.filters.projects && app.filters.projects.length > 0) {
                    projects = $.grep(todo.projects, function(project) {
                        return $.inArray(project, app.filters.projects) !== -1;
                    }).length > 0;
                }

                if (('contexts' in todo) && todo.contexts && app.filters.contexts && app.filters.contexts.length > 0) {
                    contexts = $.grep(todo.contexts, function(context) {
                        return $.inArray(context, app.filters.contexts) !== -1;
                    }).length > 0;
                }

                console.log(text, completed, completion_date, priority, creation_date, projects, contexts);

                return text && completed && completion_date && priority && creation_date && projects && contexts;
            });
        },
        // All priorities extracted from the current todo list
        allPriorities: function() {
            var all_priorities = [];

            return $.map(this.todos, function(todo) {
                if (!('priority' in todo) || !todo.priority || $.inArray(todo.priority, all_priorities) !== -1) {
                    return null;
                }

                all_priorities.push(todo.priority);

                return todo.priority;
            });
        },
        // All projects extracted from the current todo list
        allProjects: function() {
            var all_projects = [];

            return $.map(this.todos, function(todo) {
                if (!('projects' in todo) || !todo.projects) {
                    return null;
                }

                return $.map(todo.projects, function(project) {
                    if ($.inArray(project, all_projects) !== -1) {
                        return null;
                    }

                    all_projects.push(project);

                    return project;
                });
            });
        },
        // All contexts extracted from the current todo list
        allContexts: function() {
            var all_contexts = [];

            return $.map(this.todos, function(todo) {
                if (!('contexts' in todo) || !todo.contexts) {
                    return null;
                }

                return $.map(todo.contexts, function(context) {
                    if ($.inArray(context, all_contexts) !== -1) {
                        return null;
                    }

                    all_contexts.push(context);

                    return context;
                });
            });
        }
    },
    methods: {
        clearGeneralFilters: function() {
            this.filters.text = '';
            this.filters.completed = 'all';
            this.filters.completion_date = '';
            this.filters.creation_date = '';
        },
        clearPrioritiesFilters: function() {
            this.filters.priorities = [];
        },
        clearProjectsFilters: function() {
            this.filters.projects = [];
        },
        clearContextsFilters: function() {
            this.filters.contexts = [];
        },
        clearAllFilters: function() {
            this.clearGeneralFilters();
            this.clearPrioritiesFilters();
            this.clearProjectsFilters();
            this.clearContextsFilters();
        },
        addTodo: function() {
            new_todo = {};

            this.todos.unshift(new_todo);
            this.editTodo(new_todo);
        },
        editTodoText: function (todo) {
            this.todoTextBackup = todo.text;
            this.todoBeingEdited = todo;
        },
        doneEditTodoText: function (todo) {
            if (!this.todoBeingEdited) {
                return;
            }

            this.todoBeingEdited = null;

            todo.text = $.trim(todo.text);

            if (!todo.text) {
                this.removeTodo(todo);
            }
        },
        cancelEditTodoText: function (todo) {
            todo.text = this.todoTextBackup;

            this.todoTextBackup = null;
            this.todoBeingEdited = null;
        },
        // Delete a todo
        removeTodo: function (todo) {
            this.todos.splice(this.todos.indexOf(todo), 1);
        },
        // Load all todos from the Todo.txt file
        loadTodoTxt: function() {
            this.loading = true;

            $.ajax({
                type: 'GET',
                url: ROOT_URL + 'todo.txt',
                dataType: 'json',
                cache: false,
                success: function(response, status, xhr) {
                    if (response.status == 'success') {
                        app.todos = response.data;
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

                    alert('Error while loading the Todo.txt file: ' + message);
                },
                complete: function() {
                    app.loading = false;
                }
            });
        },
        // Save all todos in the Todo.txt file
        saveTodoTxt: function() {
            this.loading = true;

            $.ajax({
                type: 'POST',
                url: ROOT_URL + 'todo.txt',
                contentType: 'application/json',
                data: JSON.stringify(app.todos),
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
                    
                    alert('Error while updating the Todo.txt file: ' + message);
                },
                complete: function() {
                    app.loading = false;
                }
            });
        }
    }
});