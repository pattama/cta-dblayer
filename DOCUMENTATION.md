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
    * [.validate](#DbLayer+validate) ⇒ <code>Promise</code>
    * [.process](#DbLayer+process)

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

### dbLayer.validate ⇒ <code>Promise</code>
Validates Context properties

**Kind**: instance property of <code>[DbLayer](#DbLayer)</code>  

| Param | Type | Description |
| --- | --- | --- |
| context | <code>Context</code> | a Context |

<a name="DbLayer+process"></a>

### dbLayer.process
Process the context

**Kind**: instance property of <code>[DbLayer](#DbLayer)</code>  

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
| options | <code>Object</code> | options object to configure MongoDb driver |
| cementHelper | <code>CementHelper</code> | cementHelper instance |
| logger | <code>Logger</code> | logger instance |
| db | <code>mongodb.Db</code> | a MongoDB Database instance (connection) |


* [MongoDbLayer](#MongoDbLayer)
    * [new MongoDbLayer(configuration, cementHelper, logger)](#new_MongoDbLayer_new)
    * [.MongoDbServer](#MongoDbLayer.MongoDbServer) : <code>Object</code>

<a name="new_MongoDbLayer_new"></a>

### new MongoDbLayer(configuration, cementHelper, logger)
Create a new MongoDbLayer instance


| Param | Type | Description |
| --- | --- | --- |
| configuration | <code>Object</code> | configuration object for the MongoDb connection |
| [configuration.url] | <code>String</code> | Url connection to the Database. If provided, will discard servers and databasename properties |
| configuration.databasename | <code>String</code> | Name of the MongoDb database |
| configuration.servers | <code>Array.&lt;MongoDbServer&gt;</code> | Array of MongoDb servers |
| configuration.options | <code>Object</code> | hash of options for MongoDb. See https://mongodb.github.io/node-mongodb-native/driver-articles/mongoclient.html#mongoclient-connect-options |
| cementHelper | <code>CementHelper</code> | cementHelper instance |
| logger | <code>Logger</code> | logger instance |

<a name="MongoDbLayer.MongoDbServer"></a>

### MongoDbLayer.MongoDbServer : <code>Object</code>
MongoDbServer

**Kind**: static typedef of <code>[MongoDbLayer](#MongoDbLayer)</code>  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| host | <code>String</code> | A hostname, an IP address or an unix domain socket |
| port | <code>Number</code> | A port |

