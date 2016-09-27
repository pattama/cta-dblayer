## Classes

<dl>
<dt><a href="#DbLayer">DbLayer</a></dt>
<dd><p>DbLayer class</p>
</dd>
<dt><a href="#MongoDbLayer">MongoDbLayer</a></dt>
<dd><p>MongoDbLayer class</p>
</dd>
</dl>

<a name="DbLayer"></a>

## DbLayer
DbLayer class

**Kind**: global class  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| provider | <code>String</code> | name of Database provider |
| configuration | <code>Object</code> | configuration Object to instantiate the Database provider |
| instance | <code>Object</code> | instance of Database provider |


* [DbLayer](#DbLayer)
    * [new DbLayer(cementHelper, config)](#new_DbLayer_new)
    * [.validate(context)](#DbLayer+validate) ⇒ <code>Promise</code>

<a name="new_DbLayer_new"></a>

### new DbLayer(cementHelper, config)
Create a new DbLayer instance


| Param | Type | Description |
| --- | --- | --- |
| cementHelper | <code>CementHelper</code> | cementHelper instance |
| config | <code>Object</code> | cement configuration of the brick |
| config.properties.provider | <code>String</code> | name of Database provider |
| config.properties.configuration | <code>Object</code> | configuration Object to instantiate the Database provider and its driver |

<a name="DbLayer+validate"></a>

### dbLayer.validate(context) ⇒ <code>Promise</code>
Validates Context properties

**Kind**: instance method of <code>[DbLayer](#DbLayer)</code>  

| Param | Type | Description |
| --- | --- | --- |
| context | <code>Context</code> | a Context |

<a name="MongoDbLayer"></a>

## MongoDbLayer
MongoDbLayer class

**Kind**: global class  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| configuration | <code>Object</code> | configuration object for the MongoDb connection |
| cementHelper | <code>CementHelper</code> | cementHelper instance |
| logger | <code>Logger</code> | logger instance |
| db | <code>mongodb.Db</code> | a MongoDB Database instance (connection) |


* [MongoDbLayer](#MongoDbLayer)
    * [new MongoDbLayer(cementHelper, configuration)](#new_MongoDbLayer_new)
    * _instance_
        * [.validate(context)](#MongoDbLayer+validate) ⇒ <code>Promise</code>
        * [.process(context)](#MongoDbLayer+process)
    * _static_
        * [.MongoDbServer](#MongoDbLayer.MongoDbServer) : <code>Object</code>

<a name="new_MongoDbLayer_new"></a>

### new MongoDbLayer(cementHelper, configuration)
Create a new MongoDbLayer instance


| Param | Type | Description |
| --- | --- | --- |
| cementHelper | <code>CementHelper</code> | cementHelper instance |
| configuration | <code>Object</code> | configuration object for the MongoDb connection |
| [configuration.url] | <code>String</code> | Url connection to the Database. If provided, will discard servers and databaseName properties |
| configuration.databaseName | <code>String</code> | Name of the MongoDb database |
| configuration.servers | <code>Array.&lt;MongoDbServer&gt;</code> | Array of MongoDb servers |
| configuration.options | <code>Object</code> | hash of options for creating a new MongoDb connection. See https://mongodb.github.io/node-mongodb-native/driver-articles/mongoclient.html#mongoclient-connect-options |
| configuration.collectionOptions | <code>Object</code> | hash of options for the db.collection() method. See http://mongodb.github.io/node-mongodb-native/2.2/api/Db.html#collection |

<a name="MongoDbLayer+validate"></a>

### mongoDbLayer.validate(context) ⇒ <code>Promise</code>
Validates Job properties specific to MongoDbLayer

**Kind**: instance method of <code>[MongoDbLayer](#MongoDbLayer)</code>  

| Param | Type | Description |
| --- | --- | --- |
| context | <code>Context</code> | a Context |

<a name="MongoDbLayer+process"></a>

### mongoDbLayer.process(context)
Process the context, emit events, create new context and define listeners

**Kind**: instance method of <code>[MongoDbLayer](#MongoDbLayer)</code>  

| Param | Type | Description |
| --- | --- | --- |
| context | <code>Context</code> | a Context |

<a name="MongoDbLayer.MongoDbServer"></a>

### MongoDbLayer.MongoDbServer : <code>Object</code>
MongoDbServer

**Kind**: static typedef of <code>[MongoDbLayer](#MongoDbLayer)</code>  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| host | <code>String</code> | A hostname, an IP address or an unix domain socket |
| port | <code>Number</code> | A port |

