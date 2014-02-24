module.exports = function live (db, collection) {

  if (!db.createLiveStream) {
    return;
  }

  db.createLiveStream()
    .on('data', function (change) {

      collection.trigger('sync', change);

      var changed = collection.get(change.key);

      switch (change.type) {
        case undefined:
        case 'get':
        case 'put':
          if (changed) {
            changed.set(change.value);
          } else {
            collection.push(change.value);
          }
          break;

        case 'del':

          if (changed) { 
            changed.trigger(
              'destroy',
              changed
            );
          }
          break;

      }
    })
    .on('error', function (err) {
      throw err;
    })
    .on('close', function () {
    });
};
