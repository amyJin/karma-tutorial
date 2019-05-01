var ensightenOptions = {
    client: 'amy2017-1',
    clientId: 711,
    space: 'prod',
    isPublicSpace: 1,
    serverComponentLocation: 'nexus.ensighten.com/amy2017-1/prod/serverComponent.php',
    staticJavascriptPath: 'nexus.ensighten.com/amy2017-1/prod/code',
    ns: 'Bootstrapper',
    nexus: "nexus.ensighten.com",
    scUseCacheBuster: "false",
    enableTagAuditBeacon: "true",
    enablePagePerfBeacon: "true"
};

if ( !window[ensightenOptions.ns] ) {/** PARSER_DELIM_DO_NOT_REMOVE */

	/**
	 * Main entry for the Ensighten object.
	 * @param {Object} options Optional options for the Ensighten object.
	 * @return {Object}
	 */
	window[ensightenOptions.ns] = function(options) {
		var _private = {}, _public = {};

		/**
		 * @const
		 * @type {string}
		 * @private
		 */
		_private.version = '1.5.0';

		/**
		 * @const
		 * @type {string}
		 * @private
		 */
		_private.nexus = options.nexus || 'nexus.ensighten.com';


        /**
		 * A random value 
		 * @type {float}
		 * @private
		 */
		_private.rand = -1;

		/**
		 * @type {Object}
		 * @private
		 */
		_private.options = {
    		interval: options.interval || 100,
			erLoc: options.errorLocation || _private.nexus + '/error/e.gif',
			scLoc: options.serverComponentLocation || _private.nexus + '/' + options.client + '/serverComponent.php',
			sjPath: options.staticJavascriptPath || _private.nexus + '/' + options.client + '/code/',
			alLoc: options.alertLocation || _private.nexus + '/alerts/a.gif',
			space: options.space,
			isPublicSpace: options.isPublicSpace,
			client: options.client,
			clientId: options.clientId,
            scUseCacheBuster: options.scUseCacheBuster,
            enableTagAuditBeacon: options.enableTagAuditBeacon
		};

		/**
		 * List of all registered rules.
		 * @type {Array.<Object>}
		 * @private
		 */
		_private.ruleList = [];

		/**
		 * List of all known exceptions.
		 * @type {Array.<Object>}
		 * @private
		 */
		_private.exceptionList = [];

		/**
		 * List of all known Ensighten variables.
		 * @type {Object}
		 * @private
		 */
		_private.ensightenVariables = {};

		/**
		 * Tests if an individual rule must be executed based on whether it has run and
		 * all dependency methods return true
		 * @param {Object} rule Rule object to test.
		 */
		_private.test = function( rule ) {
			if ( rule.executionData.hasRun || (rule.executionData.runTime && rule.executionData.runTime.length > 0)) {
				return;
			}
			for ( var i = 0; i<rule.dependencies.length; i++ ) {
				if ( rule.dependencies[i]() === false ) {
					return;
				}
			}
			rule.execute( );
		};

		/**
		 * Holds the ruleId of the currently executing Rule.
		 * @type {number}
		 */
		_public.currentRuleId = -1;

        /**
		 * Holds the deploymentId of the currently executing Rule.
		 * @type {number}
		 */
		_public.currentDeploymentId = -1;

        _public.reportedErrors = [];
		_public.reportedAlerts = [];


		/**
		 * For Sitecatalyst app
		 */
		_public.AF = [];


		/**
		 *  MU-1491: Add server timestamp and ip address for client side trace
		 */
		_public._serverTime = '';
		_public._clientIP = '';


		/**
		 * Inserts the serverComponent script which returns conditional rule code
		 */
		_public.getServerComponent = function(addData) {
			_public.insertScript( window.location.protocol + '//' + _private.options.scLoc, false, (addData || true), _private.options.scUseCacheBuster );
		};

		/**
		 * Sets or overwrites an Ensighten variable
		 * @param {string} name the name of the variable to set.
		 * @param {*} value the value to set the variable to.
		 * @return {boolean}
		 */
		_public.setVariable = function(name, value) {
			_private.ensightenVariables[name] = value;
		};

		/**
		 * Gets the value of an Ensighten variable
		 * @param {string} name The name of the variable to get the value from.
		 * @return {*}
		 */
		_public.getVariable = function(name) {
			if ( name in _private.ensightenVariables ) {
				return _private.ensightenVariables[name];
			} else {
				return null;
			}
		};

		/**
		 * Tests if any rule must be executed based on whether it has run and
		 * all dependency methods return true
		 */
		_public.testAll = function() {
			for ( var i = 0; i<_private.ruleList.length; i++ ) {
				_private.test( _private.ruleList[i] );
			}
		};

		/**
		 * List of all registered rules.
		 * @type Object
		 */
		_public.executionState = {
			DOMParsed: false,
			DOMLoaded: false,
			conditionalRules: false
		};

                /**
                 * report an exception object's data back to the Ensighten back-end
		 * @param {object} e The Error object to report back to Ensighten.
		 */
		_public.reportException = function(e) {
			e.timestamp = new Date().getTime();
			_private.exceptionList.push(e);
			var src = window.location.protocol + "//" + _private.options.erLoc + "?msg=" + e.message + '&lnn=' + (e.lineNumber || e.line) + '&fn=' + (e.fileName || e.sourceURL) + '&cid=' + _private.options.clientId + '&client=' + _private.options.client + '&space=' + _private.options.space + '&rid=' + _public.currentRuleId + '&did=' + _public.currentDeploymentId;
			var img = _public.imageRequest(src);
			img.timestamp = (new Date).getTime();
			this.reportedErrors.push(img);
		};

		/**
		 * A rule object.
		 * @constructor
		 * @param {Object} params An object that holds default rule parameters.
		 */
		_public.Rule = function(params) {
			/**
			 * A method that will execute this Rule object's code
			 * @type {function()}
			 */
			 this.execute = function() {
				this.executionData.runTime.push( new Date() );
				_public.currentRuleId = this.id;
				_public.currentDeploymentId = this.deploymentId;
				try {
					this.code();
				} catch(err) {
					window[ensightenOptions.ns].reportException(err);
				} finally {
          this.executionData.hasRun = true;
					_public.testAll();
				}
			};

			/**
			 * rule id
			 * @type {Number}
			 */
			this.id = params.id;

                        /**
			 * deployment id
			 * @type {Number}
			 */
			this.deploymentId = params.deploymentId;

			/**
			 * list of rule dependency functions
			 * @type {Array.<function() : boolean>}
			 */
			this.dependencies = params.dependencies || [];

			/**
			 * rule code
			 * @type {function()}
			 */
			this.code = params.code;

			/**
			 * object storing data about rule execution
			 * @type {Object}
			 */
			this.executionData = {
				hasRun: false,
				runTime: []
			};
		};

		/**
		 * Places a new rule in the ruleList after checking for duplicate rule ID
		 * @param {Object} rule A Rule object.
		 * @return {boolean}
		 */
		 _public.registerRule = function(rule) {
			/**
			 * Check if the rule is already in the rule list, unless the rule id is -1
			 */
			if ( _public.getRule(rule.id) && rule.id !== -1 ) {
				return false;
			} else {
				/**
				 * Add the Rule object to the rule list, and test if its dependencies have been met
				 */
				_private.ruleList.push( rule );
				_public.testAll();
				return true;
			}
		};

		/**
		 * Searches the rule list for a particular rule by rule ID
		 * @param {Number} id A Rule object id.
		 * @return {Object}
		 */
		 _public.getRule = function(id) {
			for ( var i = 0; i<_private.ruleList.length; i++ ) {
				if ( _private.ruleList[i].id === id ) {
					return _private.ruleList[i];
				}
			}
			return false;
		};

		/**
		 * Determines if a rule has been executed at least once by Rule id
		 * @param {Number} id A Rule object id.
		 * @return {boolean}
		 */
		 _public.hasRuleRun = function(id) {
			var rule = _public.getRule(id);
			if ( rule ) {
				return rule.executionData.hasRun;
			}
			return false;
		};

		/**
		 * prepend '0' to single digit numbers
		 * @private
		 * @param {string} a The number to prepend a 0 to if needed.
		 * @return {string}
		 */
		_private.toTwoChar = function(a) {
			return ((a.toString().length === 2) ? '' : '0') + a;
		};

		/**
		 * An alert object.
		 * @constructor
		 * @param {Object} params An object that holds default alert parameters.
		 */
		_public.Alert = function(params) {
			var d = new Date();
			var date = d.getFullYear() + '-' + _private.toTwoChar(d.getMonth()) + '-' + _private.toTwoChar(d.getDate()) + ' ' + _private.toTwoChar(d.getHours()) + ':' + _private.toTwoChar(d.getMinutes()) + ':' + _private.toTwoChar(d.getSeconds());

			this.severity = params.severity || 1;
			this.date = date;
			this.subject = params.subject || '';
			this.type = params.type || 1;
			this.ruleId = params.ruleId || -1;
		};

		/**
		 * report an alert object's data back to the Ensighten back-end
		 * @param {object} a The Alert object to report back to Ensighten.
		 */
		 _public.generateAlert = function(a) {
			var src = window.location.protocol + "//" + _private.options.alLoc + "?d=" + a.date + "&su=" + a.subject + "&se=" + a.severity + "&t=" + a.type + '&cid=' + _private.options.clientId + '&client=' + _private.options.client + '&space=' + _private.options.space + '&rid=' + _public.currentRuleId + '&did=' + _public.currentDeploymentId;
			var img = _public.imageRequest( src );
			img.timestamp = (new Date).getTime();
			this.reportedAlerts.push(img);
		};

		/**
		 * make an image request
		 * @param {object} src The url of the image to request.
		 */
		_public.imageRequest = function(src) {
			var transmit = new Image(0,0);
			transmit.src = src;
			return transmit;
		};

		/**
		 * Insert a script tag into the DOM
		 * Partial inspiration provided by Google Analytics code via http://www.stevesouders.com/blog/2010/05/11/appendchild-vs-insertbefore/
		 * @param {string} src The url of the javascript file to insert into the page.
		 * @param {boolean=} dedupe (optional) whether to abort if a script with the same src is already on the page.
		 * @param {boolean=} addData (optional) whether to add data about the client to the request (for server component).
         * @param {boolean} useCacheBuster (optional; default to true) use cache buster when requesting script
		 */
		 _public.insertScript = function(src, dedupe, data, useCacheBuster) {
			var scripts = document.getElementsByTagName('script'),
				i,
				s = scripts[0];
			  
			dedupe = dedupe !== undefined ? dedupe : true;
            useCacheBuster = ( useCacheBuster !== undefined ) ? useCacheBuster : true;

			if ( dedupe ) {
				for ( i = 0; i< scripts.length; i++ ) {
					if ( scripts[i].src === src && scripts[i].readyState && /loaded|complete/.test(scripts[i].readyState)  ) {
						return;
					}
				}
			}

			if (data) {
				data = data == true && typeof window._ensSCData == 'object' ? window._ensSCData : data;
        		_private.rand = Math.random()*("1E"+(10*Math.random()).toFixed(0));
					
				var u = window.location.href;
		        if (typeof data === 'object') {
					for (i in data) {
						var c = ~u.indexOf("#") ? u.slice(u.indexOf("#"), u.length) : "",
							u = u.slice(0, c.length ? u.length - c.length : u.length),
							u = u + (~u.indexOf("?") ? "&" : "?");
						
						for (k in data) u += k + "=" + data[k] + "&";
						u = u.slice(0, -1) + c;
						break
					}
		        }

		        src += '?';

                if (useCacheBuster)
                {
                  src += 'r=' + _private.rand + '&';
                }

		        src += ('ClientID=' + _private.options.clientId + '&PageID=' + encodeURIComponent(u));
		    }
			(function (e, b, d) {
		        var a = b.head || b.getElementsByTagName("head");
		        setTimeout(function () {
		            if ("item" in a) {
		                if (!a[0]) {
		                    setTimeout(arguments.callee, 25);
		                    return
		                }
		                a = a[0]
		            }
		            var c = b.createElement("script");
		            c.src = d;
		            c.onload = c.onerror = function () {
		                if (this.addEventListener) {
		                    this.readyState = "loaded";
		                }
		            };
		            a.insertBefore(c, a.firstChild)
	       		 }, 0);
			})(window, document, src);
		};

		/**
		 * Insert a script tag into the DOM then call a function when the script has downloaded and executed
		 * Partial inspiration provided by Google Analytics code via http://www.stevesouders.com/blog/2010/05/11/appendchild-vs-insertbefore/
		 * @param {string} src The url of the javascript file to insert into the page.
		 * @param {function()} callback The function to execute when the script tag has downloaded and executed.
		 * @param {boolean=} dedupe (optional) whether to abort if a script with the same src is already on the page.
		 */
		_public.loadScriptCallback = function(src, callback, dedupe) {
			var scripts = document.getElementsByTagName('script'),
				i,
				s = scripts[0];
			dedupe = dedupe || true;

			if ( dedupe ) {
				for ( i = 0; i< scripts.length; i++ ) {
					if ( scripts[i].src === src && scripts[i].readyState && /loaded|complete/.test(scripts[i].readyState)  ) {
						try {
							callback();
						} catch(e) {
							window[ensightenOptions.ns].reportException(e);
						} finally {
							return;
						}
					}
				}
			}

			var newScript = document.createElement('script');
			newScript.type = 'text/javascript';
			newScript.async = true;
			newScript.src = src;
			newScript.onerror = function() {
				if ( this.addEventListener ) this.readyState = 'loaded';
			};
			newScript.onload = newScript.onreadystatechange = function() {
				if ((!this.readyState || this.readyState === 'complete' || this.readyState === 'loaded') ) {
					this.onload = this.onreadystatechange = null;
					if ( this.addEventListener )
						this.readyState = "loaded";
					try {
						callback.call(this);
					} catch(e) {
						window[ensightenOptions.ns].reportException(e);
					}
				}
			};

			s.parentNode.insertBefore(newScript, s);
		};

		/**
		 * Add a method call to an element's event handler unobtrusively
		 * Note: this will leak memory in IE unless the web developer removes event handlers when the page unloads... automate?
		 * TODO: add try/catch around internal anonymous fn or use _public.anonymous?
		 * @param {object} element The element to add an event handler to.
		 * @param {string} event The event to add a function to.
		 * @param {function()} fn The function to execute when the event handler is invoked.
		 */
		_public.unobtrusiveAddEvent = function (element,event,fn) {
			try {
				var old = (element[event]) ? element[event] : function () {};
				element[event] = function () {fn.apply(this, arguments); return old.apply(this, arguments); };
			} catch(err) {
				window[ensightenOptions.ns].reportException(err);
			}
		};

		/**
		 * Function that will take an anonymous function as an input, and return an anonymous function with Ensighten
		 * error handlers wrapped around it
		 * @param {function()} f The function to wrap in error handling
		 * @param {number} id The ID of the rule that setup the anonymous function
		 */
		_public.anonymous = function(f, id) {
			return function() {
				try {
					if ( id ) {
						_public.currentRuleId = id;
					} else {
						_public.currentRuleId = 'anonymous';
					}

					f();
				} catch(err) {
					window[ensightenOptions.ns].reportException(err);
				}
			};
		};

		/* Backward compatibility required public methods */

		_public.setCurrentRuleId = function(rid) {
			_public.currentRuleId = rid;
		};

		_public.setCurrentDeploymentId = function(did) {
			_public.currentDeploymentId = did;
		};

		/**
		 * Bind a function or rule to Immediately execute
		 * @param {function()|object} f A Rule object or function.
		 * @param {String} rid Optional override of the id to assign to a new rule in the case of f being a function.
		 * @param {String} did Optional corresponding deploymentId of the rule
		 * @return {boolean}
		 */
		 _public.bindImmediate = function(f, rid, did) {
			var newRule;
			if ( typeof f === 'function' ) {
				newRule = new _public.Rule( {
					id: rid || -1,
					deploymentId: did || -1,
					dependencies: [],
					code: f
				} );
			} else if ( typeof f === 'object' ) {
				newRule = f;
			} else {
				return false;
			}
			_public.registerRule( newRule );
		};
		/**
		 * Bind a function or rule to the DOM Parsed event
		 * @param {function()|object} f A Rule object or function.
		 * @param {String} rid Optional override of the id to assign to a new rule in the case of f being a function.
		 * @param {String} did Optional corresponding deploymentId of the rule
		 * @return {boolean}
		 */
		 _public.bindDOMParsed = function(f, rid, did) {
			var newRule;
			if ( typeof f === 'function' ) {
				newRule = new _public.Rule( {
					id: rid || -1,
					deploymentId: did || -1,
					dependencies: [ function() {
						return window[ensightenOptions.ns].executionState.DOMParsed;
					} ],
					code: f
				} );
			} else if ( typeof f === 'object' ) {
				newRule = f;
			} else {
				return false;
			}
			_public.registerRule( newRule );
		};

		/**
		 * Bind a function or rule to the DOM Loaded event
		 * @param {function()|object} f A Rule object or function.
		 * @param {String} rid Optional override of the id to assign to a new rule in the case of f being a function.
		 * @param {String} did Optional corresponding deploymentId of the rule
		 * @return {boolean}
		 */
		 _public.bindDOMLoaded = function(f, rid, did) {
			var newRule;
			if ( typeof f === 'function' ) {
				newRule = new _public.Rule( {
					id: rid || -1,
					deploymentId: did || -1,
					dependencies: [ function() {
						return window[ensightenOptions.ns].executionState.DOMLoaded;
					} ],
					code: f
				} );
			} else if ( typeof f === 'object' ) {
				newRule = f;
			} else {
				return false;
			}

			_public.registerRule( newRule );
		};

		/**
		 * Bind a function or rule to the page specific code download/execute completion event
		 * @param {function()|object} f A Rule object or function.
		 * @param {String} rid Optional override of the id to assign to a new rule in the case of f being a function.
		 * @param {String} did Optional corresponding deploymentId of the rule
		 * @return {boolean}
		 */
		_public.bindPageSpecificCompletion = function(f, rid, did) {
			var newRule;

			if ( typeof f === 'function' ) {
				newRule = new _public.Rule( {
					id: rid || -1,
					deploymentId: did || -1,
					dependencies: [ function() {
						return window[ensightenOptions.ns].executionState.conditionalRules;
					} ],
					code: f
				} );
			} else if ( typeof f === 'object' ) {
				newRule = f;
			} else {
				return false;
			}

			_public.registerRule( newRule );
		};

		/**
		 * Check rules are all executed or not.
		 * @param {String} ids Ids in a string, splitted by ','.
		 * @return {boolean}
		 */
		_public.checkHasRun = function(ids) {
		  if ( ids.length === 0 ) {
		    return true;
		  }

                  var rule;
		  for ( var i=0; i<ids.length; ++i ) {
                    rule = _public.getRule(parseInt(ids[i], 10));

                    if( !rule ) {
                      return false;
                    }

                    if(!rule.executionData.hasRun) {
                      return false;
                    }
		  }

		  return true;
		}; 

		/**
		 * Bind a function or rule to be immediately fired with multiple rule dependencies
		 * @param {function()|object} f A Rule object or function.
		 * @param {String=} ruleId Optional override of the id to assign to a new rule in the case of f being a function.
		 * @param {String=} dependency Optional List of dependency rule ids.
		 * @param {String=} deploymentId Optional Deployment ID of the rule.
		 * @param {String=} dependency Optional List of dependency deployment ids.
		 * @return {boolean}
		 */
		 _public.bindDependencyImmediate = function(f, rid, dependencyRids, did, dependencyDids) {
			var newRule,
			    dependencyFArray = [];

                        dependencyFArray.push(
                          function() {
				return window[ensightenOptions.ns].checkHasRun(dependencyRids);
		          }
                        );

			if ( typeof f === 'function' ) {
				newRule = new _public.Rule( {
					id: rid || -1,
					deploymentId: did || -1,
					dependencies: dependencyFArray,
					code: f
				} );
			} else if ( typeof f === 'object' ) {
				newRule = f;
			} else {
				return false;
			}

			_public.registerRule( newRule );
		};

		/**
		 * Bind a function or rule to the DOM Loaded event with multiple rule dependencies
		 * @param {function()|object} f A Rule object or function.
		 * @param {String=} ruleId Optional override of the id to assign to a new rule in the case of f being a function.
		 * @param {String=} dependency Optional List of dependency rule ids.
		 * @param {String=} deploymentId Optional Deployment ID of the rule.
		 * @param {String=} dependency Optional List of dependency deployment ids.
		 * @return {boolean}
		 */
		 _public.bindDependencyDOMLoaded = function(f, rid, dependencyRids, did, dependencyDids) {
			var newRule,
			    dependencyFArray = [];
                
            dependencyFArray.push(
              function() {
				return window[ensightenOptions.ns].executionState.DOMLoaded;
		      }
            );

            dependencyFArray.push(
              function() {
		        return window[ensightenOptions.ns].checkHasRun(dependencyRids);
		      }
            );

			if ( typeof f === 'function' ) {
				newRule = new _public.Rule( {
					id: rid || -1,
					deploymentId: did || -1,
					dependencies: dependencyFArray,
					code: f
				} );
			} else if ( typeof f === 'object' ) {
				newRule = f;
			} else {
				return false;
			}

			_public.registerRule( newRule );
		};

		/**
		 * Bind a function or rule to the DOM parsed event with multiple rule dependencies
		 * @param {function()|object} f A Rule object or function.
		 * @param {String=} ruleId Optional override of the id to assign to a new rule in the case of f being a function.
		 * @param {String=} dependency Optional List of dependency rule ids.
		 * @param {String=} deploymentId Optional Deployment ID of the rule.
		 * @param {String=} dependency Optional List of dependency deployment ids.
		 * @return {boolean}
		 */
		 _public.bindDependencyDOMParsed = function(f, rid, dependencyRids, did, dependencyDids) {
			var newRule,
			    dependencyFArray = [];

                        dependencyFArray.push(
                          function() {
				return window[ensightenOptions.ns].executionState.DOMParsed;
		          }
                        );

                        dependencyFArray.push(
                          function() {
				return window[ensightenOptions.ns].checkHasRun(dependencyRids);
		          }
                        );

			if ( typeof f === 'function' ) {
				newRule = new _public.Rule( {
					id: rid || -1,
					deploymentId: did || -1,
					dependencies: dependencyFArray,
					code: f
				} );
			} else if ( typeof f === 'object' ) {
				newRule = f;
			} else {
				return false;
			}

			_public.registerRule( newRule );
		};

		/**
		 * Bind a function or rule to the page specific code download/execute completion event with multiple rule dependencies
		 * @param {function()|object} f A Rule object or function.
		 * @param {String=} ruleId Optional override of the id to assign to a new rule in the case of f being a function.
		 * @param {String=} dependency Optional List of dependency rule ids.
		 * @param {String=} deploymentId Optional Deployment ID of the rule.
		 * @param {String=} dependency Optional List of dependency deployment ids.
		 * @return {boolean}
		 */
		 _public.bindDependencyPageSpecificCompletion = function(f, rid, dependencyRids, did, dependencyDids) {
		   var newRule,
		       dependencyFArray = [];

                   dependencyFArray.push(
                     function() {
		       return window[ensightenOptions.ns].executionState.conditionalRules;
		     }
                   );         

                   dependencyFArray.push(
                     function() {
		       return window[ensightenOptions.ns].checkHasRun(dependencyRids);
		     }
                   );

		   if ( typeof f === 'function' ) {
		     newRule = new _public.Rule( {
			   id: rid || -1,
			   deploymentId: did || -1,
			   dependencies: dependencyFArray,
			   code: f
			 } );
		   } else if ( typeof f === 'object' ) {
		     newRule = f;
		   } else {
		     return false;
		   }

		   _public.registerRule( newRule );
		 };


		/**
		 * Inform the framework that the DOM has parsed
		 */
		_public.callOnDOMParsed = function() {
			window[ensightenOptions.ns].executionState.DOMParsed = true;
			window[ensightenOptions.ns].testAll();
		};

		/**
		 * Inform the framework that the DOM has loaded
		 */
		 _public.callOnDOMLoaded = function() {
			window[ensightenOptions.ns].executionState.DOMParsed = true;
			window[ensightenOptions.ns].executionState.DOMLoaded = true;
			window[ensightenOptions.ns].testAll();
		};

		/**
		 * Inform the framework that the page specific code has downloaded, and
		 * execution code has been added to the call stack, setTimeout(f,1) in order to
		 * ensure any dependent code is added after the page specific code has been placed on the call stack
		 */
		_public.callOnPageSpecificCompletion = function() {
			for (var b = document.getElementsByTagName("script"), a = 0, c = b.length; a < c; a++) {
				if (b[a].src && b[a].src.match(/\.ensighten\.com\/(.+?)\/code\/.*/i) && !("loaded" == b[a].readyState || "complete" == b[a].readyState)) {
					setTimeout(window[ensightenOptions.ns].callOnPageSpecificCompletion, 50);
					return;
				}
			}
			setTimeout( function() {
				window[ensightenOptions.ns].executionState.conditionalRules = true;
				window[ensightenOptions.ns].testAll();
			}, 1 );
		};

		/**
		 * Check if the framework has seen the DOM Parsed event
		 * @return {boolean}
		 */
		_public.hasDOMParsed = function() {
			return window[ensightenOptions.ns].executionState.DOMParsed;
		};

		/**
		 * Check if the framework has seen the DOM Loaded event
		 * @return {boolean}
		 */
		 _public.hasDOMLoaded = function() {
			return window[ensightenOptions.ns].executionState.DOMLoaded;
		};

		/**
		 * Check if the framework has seen the DOM Parsed event
		 * @return {boolean}
		 */
		_public.hasPageSpecificCompletion = function() {
			return window[ensightenOptions.ns].executionState.conditionalRules;
		};

		/* Legacy Code */
		var fArray = function() {
			var funcs = [];
			var hasRun = false;
			var running = false;
			return {
				add: function(f) {
					if ( hasRun && !running){
						f();
						return;
					}
					if( typeof f != "function" ) {
						return;
					}
					funcs[funcs.length] = f;
				},
				exec: function() {
					running = true;
					do {
						var toRun = funcs;
						funcs = [];
						hasRun = true;
						for( var i=0; i<toRun.length; i++ ) {
							try { toRun[i].call(window); } catch(e) { window[ensightenOptions.ns].reportException( e ); }
						}
					} while ( funcs.length > 0 );
					running = false;
				},
				haveRun: function() {
					return hasRun;
				}
			};
		};

		_public.new_fArray = function() { return fArray(); };
		/**
		 * Potentially hold a timer event used for DOM Ready detection in webkit
		 * @type {object|null}
		 */
		_private.timer = null;

		/**
		 *	Setup shim for console
		 *	https://github.com/kayahr/console-shim/blob/master/console-shim-min.js
		 */
		(function(){function c(a,b){return function(){a.apply(b,arguments)}}if(!window.console)window.console={};var a=window.console;if(!a.log)if(window.log4javascript){var b=log4javascript.getDefaultLogger();a.log=c(b.info,b);a.debug=c(b.debug,b);a.info=c(b.info,b);a.warn=c(b.warn,b);a.error=c(b.error,b)}else a.log=function(){};if(!a.debug)a.debug=a.log;if(!a.info)a.info=a.log;if(!a.warn)a.warn=a.log;if(!a.error)a.error=a.log})();

		/**
		 * Setup event handlers for DOM Ready and DOM Loaded
		 * Inspired by Dean Edwards: http://dean.edwards.name/weblog/2006/06/again/ & Matthias Miller
		 */
		if (document.addEventListener) {
			// if webkit
			if ( (navigator.userAgent.indexOf('AppleWebKit/') > -1) ) {
				_private.timer = window.setInterval(function() {
						if (/loaded|complete/.test(document.readyState)) {
							clearInterval(_private.timer);
							_public.callOnDOMParsed();
						}
				}, 50);
			} else {
				document.addEventListener("DOMContentLoaded", _public.callOnDOMParsed, false);
			}
			window.addEventListener("load", _public.callOnDOMLoaded, false);
		} else {
			setTimeout(function () {
				var d = window.document;
				(function () {
				    try {
				        if (!document.body) throw "continue";
				        d.documentElement.doScroll('left')
				    } catch (e) {
				        setTimeout(arguments.callee, 15);
				        return
				    }
				    window[ensightenOptions.ns].callOnDOMParsed()
				})()
			}, 1);
			window.attachEvent('onload', function(){
				window[ensightenOptions.ns].callOnDOMLoaded();
			});
		}

	  /**
       *  Add tag audit beacon
       */
      if(_private.options.enableTagAuditBeacon === 'true'){
        window.setTimeout(function(){
          try {
            // Get data and idx field for the img request
            var ruleDataList = [],
                data,
                idx = 0,
                rule,
                isExecuted,
                singleData;

            for (var i=0; i<_private.ruleList.length; ++i) {
              rule = _private.ruleList[i];
              isExecuted = rule.executionData.hasRun ? '1' : '0';
              singleData = rule.deploymentId.toString() + '|' + rule.id.toString() + '|' + isExecuted;

              ruleDataList.push(singleData);
            }

            data = "[" + ruleDataList.join(";") + "]";

            var src = window.location.protocol + "//" + _private.nexus + "/" + options.client + "/" + options.space + "/TagAuditBeacon.rnc?cid=" + options.clientId + "&data=" + data + "&idx=" + idx + "&r=" + _private.rand,
                img = _public.imageRequest(src);
          } catch (e) {
            window[ensightenOptions.ns].reportException(e);
          }
        }, 3000);
      }

	  /**
	   * Begin checking every (_private.options.interval) ms for if a rule should be executed
	   */
	  window.setInterval( _public.testAll, _private.options.interval );

	  return _public;
	}( ensightenOptions );


	/**
	 *  Add page performance beacon
	 */
    if ( ensightenOptions.enablePagePerfBeacon === 'true' ) {
      window[ensightenOptions.ns].bindDOMParsed(
        function(){(
          function __ensightenNavTiming(){
            var perf = window.performance;

            if (!perf) return;

            var timing = perf.timing || {},
                recordEvents = '',
                initialTime = timing['navigationStart'] || 0,
                temp,
                data,
                keyMapping = {
                  connectEnd: 'ce',
                  connectStart: 'cs',
                  domComplete: 'dc',
                  domContentLoadedEventEnd: 'dclee',
                  domContentLoadedEventStart: 'dcles',
                  domInteractive: 'di',
                  domLoading: 'dl',
                  domainLookupEnd: 'dle',
                  domainLookupStart: 'dls',
                  fetchStart: 'fs',
                  loadEventEnd: 'lee',
                  loadEventStart: 'les',
                  redirectEnd: 'rede',
                  redirectStart: 'reds',
                  requestStart: 'reqs',
                  responseStart: 'resps',
                  responseEnd: 'respe',
                  secureConnectionStart: 'scs',
                  unloadEventStart: 'ues',
                  unloadEventEnd: 'uee'
                };

            recordEvents = '&ns=' + timing.navigationStart;

            for (var key in keyMapping) {
              if (timing[key] !== undefined) {
                temp = timing[key] - initialTime;
                recordEvents +=  '&' + keyMapping[key] + '=' + (temp > 0 ? temp : 0);
              } else {
              	recordEvents += '&' + keyMapping[key] + '=-1';
              }
            }

            window[ensightenOptions.ns].timing = recordEvents;

            var host = ensightenOptions.nexus || 'nexus.ensighten.com',
              path = ensightenOptions.staticJavascriptPath || '',
              startIdx = path.indexOf(".com/"),
              endIdx = path.indexOf("/code/"),
              uri = path.substring(startIdx+4, endIdx) + '/perf.rnc';

            uri += '?cid=' + ensightenOptions.clientId + window[ensightenOptions.ns].timing;

            window[ensightenOptions.ns].imageRequest( '//' + host + uri );
          })();
        });
      }


	/* This block of code is to be replaced by immediate global code */
	/* End of code to be replaced */
/** PARSER_DELIM_DO_NOT_REMOVE */  
	Bootstrapper.getServerComponent(Bootstrapper.getExtraParams ? Bootstrapper.getExtraParams() : undefined);
}