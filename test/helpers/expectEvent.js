export default async (promise, event) => {
    var tx = await promise;
    
    var logs = tx.logs.filter(log => log.event == event.event && JSON.stringify(log.args) == JSON.stringify(event.args));
    assert.equal(1, logs.length, 'Event ' + event.event + ' should fire exactly once')
};