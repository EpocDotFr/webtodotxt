var app = new Vue({
    delimiters: ['${', '}'],
    el: '#app',
    data: {
        loading: false,
        todoTextBackup: null,
        todoBeingEdited: null,
        todos: [],
        filters: {
            completed: 'all',
            completion_date: null,
            creation_date: null
        }
    },
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
        filteredTodos: function () {
            return this.todos.filter(function (todo) {
                if (app.filters.completed == 'yes') {
                    return todo.completed;
                } else if (app.filters.completed == 'no') {
                    return !todo.completed;
                }

                return true;
            });
        }
    },
    methods: {
        addTodo: function() {
            new_todo = {};

            this.todos.unshift(new_todo);
            this.editTodo(new_todo);
        },
        editTodo: function (todo) {
            this.todoTextBackup = todo.text;
            this.todoBeingEdited = todo;
        },
        doneEdit: function (todo) {
            if (!this.todoBeingEdited) {
                return;
            }

            this.todoBeingEdited = null;

            todo.text = todo.text.trim();

            if (!todo.text) {
                this.removeTodo(todo);
            }
        },
        cancelEdit: function (todo) {
            todo.text = this.todoTextBackup;

            this.todoTextBackup = null;
            this.todoBeingEdited = null;
        },
        removeTodo: function (todo) {
            this.todos.splice(this.todos.indexOf(todo), 1);
        },
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