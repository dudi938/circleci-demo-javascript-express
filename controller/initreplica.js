var cfg = { _id: 'csReplicaSet',
    members: [
        { _id: 0, host: '@IpAddress1@:27017'},
        { _id: 1, host: '@IpAddress2@:27017'},
        { _id: 2, host: '@IpAddress3@:27017', arbiterOnly: true}
    ]
};
var error = rs.initiate(cfg);
printjson(error);
