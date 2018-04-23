var req = require('request');

exports.handler = function (request, context) {
    //log("DEBUG:", "start ", JSON.stringify(request));
    if (request.directive.header.namespace === 'Alexa.Discovery' && request.directive.header.name === 'Discover') {
        log("DEBUG:", "Discover request",  JSON.stringify(request));
        handleDiscovery(request, context, "");
    }
    else if (request.directive.header.namespace === 'Alexa.PowerController') {
        if (request.directive.header.name === 'TurnOn' || request.directive.header.name === 'TurnOff') {
            log("DEBUG:", "TurnOn or TurnOff Request", JSON.stringify(request));
            handlePowerControl(request, context);
        }
    }
    else if (request.directive.header.name === 'ReportState') {
        log("DEBUG", "ReportState", JSON.stringify(request))
        reportState(request, context);
    }

    function handleDiscovery(request, context) {
        var payload = {
            "endpoints":
            [
                {
                    "endpointId": "demo_id",
                    "manufacturerName": "Smart Device Company",
                    "friendlyName": "Test Device",
                    "description": "Smart Device Switch",
                    "displayCategories": ["SWITCH"],
                    "cookie": {
                    },
                    "capabilities":
                    [
                        {
                          "type": "AlexaInterface",
                          "interface": "Alexa",
                          "version": "3"
                        },
                        {
                            "interface": "Alexa.PowerController",
                            "version": "3",
                            "type": "AlexaInterface",
                            "properties": {
                                "supported": [{
                                    "name": "powerState"
                                }],
                                "retrievable": false,
                                "proactivelyReported": false
                            }
                        }
                    ]
                }
            ]
        };
        var header = request.directive.header;
        header.name = "Discover.Response";
        log("DEBUG", "Discovery Response: ", JSON.stringify({ header: header, payload: payload }));
        context.succeed({ event: { header: header, payload: payload } });
    }

    function log(message, message1, message2) {
        console.log(message + message1 + message2);
    }
    
    function reportState(request, context) {
        
        log("DEBUG:", " starting ", JSON.stringify(request));
        var requestToken = request.directive.endpoint.scope.token;
        
        var responseHeader = request.directive.header;
        responseHeader.namespace = "Alexa";
        responseHeader.name = "ErrorResponse";

        var response = {
            event: {
                header: responseHeader,
                endpoint: request.directive.endpoint,
                payload: {
                    type: "EXPIRED_AUTHORIZATION_CREDENTIAL",
                    message: "oAuth token expired"
                }
            }
        };

        req.get('https://oauth-test.hardill.me.uk/testing', {
            auth: {
                'bearer' :requestToken 
            },
            timeout: 2000
        },function(err, resp, body){
            if (!err && resp.statusCode == 401) {
                responseHeader.namespace = "Alexa";
                responseHeader.name = "ErrorResponse";

                response = {
                    event: {
                        //context: contextResult,
                        header: responseHeader,
                        endpoint: request.directive.endpoint,
                        payload: {
                            type: "EXPIRED_AUTHORIZATION_CREDENTIAL",
                            //type: "ENDPOINT_LOW_POWER",
                            //percentageState: 5,
                            message: "oAuth token expired"
                            
                        }
                    }
                };

                //delete response.event.endpoint.scope;
            }

            log("DEBUG ", "Alexa.PowerController -  ", JSON.stringify(response));

            context.succeed(response);
        });

        // log("DEBUG", "ReportState ", JSON.stringify(response));

        // context.succeed(response);
        
    }

    function handlePowerControl(request, context) {
        // get device ID passed in during discovery
        var requestMethod = request.directive.header.name;
        // get user token pass in request
        var requestToken = request.directive.endpoint.scope.token;
        var powerResult;

        if (requestMethod === "TurnOn") {

            // Make the call to your device cloud for control 
            // powerResult = stubControlFunctionToYourCloud(endpointId, token, request);
            powerResult = "ON";
        }
       else if (requestMethod === "TurnOff") {
            // Make the call to your device cloud for control and check for success 
            // powerResult = stubControlFunctionToYourCloud(endpointId, token, request);
            powerResult = "OFF";
        }

        var contextResult = {
            "properties": [{
                "namespace": "Alexa.PowerController",
                "name": "powerState",
                "value": powerResult,
                "timeOfSample": new Date().toISOString(), // "2017-09-03T16:20:50.52Z", //retrieve from result.
                "uncertaintyInMilliseconds": 500
            }]
        };

        var responseHeader = request.directive.header;
        responseHeader.namespace = "Alexa";
        responseHeader.name = "Response";
        responseHeader.messageId = responseHeader.messageId + "-R";
        var response = {
            context: contextResult,
            event: {
                header: responseHeader
            },
            payload: {}

        };

        req.get('https://oauth-test.hardill.me.uk/testing', {
            auth: {
                'bearer' :requestToken 
            },
            timeout: 2000
        },function(err, resp, body){
            if (!err && resp.statusCode == 401) {
                responseHeader.namespace = "Alexa";
                responseHeader.name = "ErrorResponse";

                response = {
                    event: {
                        //context: contextResult,
                        header: responseHeader,
                        endpoint: request.directive.endpoint,
                        payload: {
                            type: "EXPIRED_AUTHORIZATION_CREDENTIAL",
                            //type: "ENDPOINT_LOW_POWER",
                            //percentageState: 5,
                            message: "oAuth token expired"
                            
                        }
                    }
                };

                //delete response.event.endpoint.scope;
            }

            log("DEBUG ", "Alexa.PowerController -  ", JSON.stringify(response));

            context.succeed(response);
        });


        
    }
};

