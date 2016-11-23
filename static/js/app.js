var app = new Vue({
    delimiters: ['${', '}'],
    el: '#app',
    data: {
        loading: false,
        todos: []
    },
    mounted: function () {
        this.$nextTick(function () {
            app.loadTodos();
        });
    },
    methods: {
        loadTodos: function() {
            this.loading = true;

            $.ajax({
                type: 'GET',
                url: ROOT_URL + 'todo.txt',
                dataType: 'json',
                cache: false,
                success: function(response) {
                    if (response.status == 'success') {
                        app.todos = response.data;
                    } else {
                        alert(response.data.message);
                    }
                },
                error: function() {
                    alert('Network error while loading the Todo.txt file.');
                },
                complete: function() {
                    app.loading = false;
                }
            });
        }
    }
});