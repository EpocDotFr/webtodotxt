var app = new Vue({
    delimiters: ['${', '}'],
    el: '#app',
    data: {
        loading: false,
        todos: [
            {
                text: 'Chuck Norris doesn\'t have disk latency because the hard drive knows to hurry the hell up',
                completion_date: '2016-11-20',
                priority: 'A',
                projects: ['machine'],
                contexts: ['truc', 'blah']
            },
            {
                text: 'Chuck Norris doesn\'t have disk latency because the hard drive knows to hurry the hell up',
                completed: false,
                completion_date: '2016-11-20',
                priority: 'B',
                creation_date: '2016-10-05',
                projects: ['machine', 'ahah'],
                contexts: ['truc']
            },
            {
                text: 'Chuck Norris doesn\'t have disk latency because the hard drive knows to hurry the hell up',
                completed: true,
                completion_date: '2016-11-20',
                creation_date: '2016-10-05',
                projects: ['machine'],
                contexts: ['truc', 'tasoeur']
            },
            {
                text: 'Chuck Norris doesn\'t have disk latency because the hard drive knows to hurry the hell up',
                completed: false,
                completion_date: '2016-11-20',
                priority: 'C',
                creation_date: '2016-10-05',
                projects: ['machine', 'ahah'],
                contexts: ['truc']
            },
            {
                text: 'Chuck Norris doesn\'t have disk latency because the hard drive knows to hurry the hell up',
                completed: false,
                completion_date: '2016-11-20',
                priority: 'D',
                creation_date: '2016-10-05',
                projects: ['machine', 'ahah'],
                contexts: ['truc']
            },
            {
                text: 'Chuck Norris doesn\'t have disk latency because the hard drive knows to hurry the hell up',
                completed: false,
                completion_date: '2016-11-20',
                priority: 'E',
                creation_date: '2016-10-05',
                projects: ['machine', 'ahah'],
                contexts: ['truc']
            },
            {
                text: 'Chuck Norris doesn\'t have disk latency because the hard drive knows to hurry the hell up',
                completed: false,
                completion_date: '2016-11-20',
                priority: 'F',
                creation_date: '2016-10-05',
                projects: ['machine', 'ahah'],
                contexts: ['truc']
            }
        ]
    }
});