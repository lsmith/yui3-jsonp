YUI.add('jsonp', function (Y) {
    var l = Y.Lang,
        noop = function () {};

    /**
     * <p>Send a JSONP request, having the response processed by the provided
     * callback function.</p>
     *
     * <p>The url of the JSONP service should include the substring "{callback}"
     * in place of the name of the callback function to be executed.  E.g
     * <code>Y.jsonp("http://foo.com/bar?cb={callback}",myCallback);</code></p>
     *
     * <p>The second argument can be a callback function that accepts the JSON
     * payload as its argument, or a configuration object supporting the keys:</p>
     * <ul>
     *   <li>success - function handler for successful transmission</li>
     *   <li>failure - function handler for failed transmission</li>
     *   <li>pattern - RegExp instance used to insert the generated callback name into the JSONP url (default /\{callback\}/i)</li>
     * </ul>
     *
     * @method jsonp
     * @param url {String} the url of the JSONP service with the {callback}
     *          placeholder where the callback function name typically goes.
     * @param c {Function|Object} Callback function accepting the JSON payload
     *          as its argument, or a configuration object (see above).
     * @chainable
     * @return {YUI Instance}
     */
    Y.jsonp = function (url,c) {
        if (!url) {
            Y.log("JSONP URL not provided","warn","jsonp");
            return this;
        }

        c = l.isObject(c) ? c : {};

        var success = (l.isFunction(c) ? c :
                       l.isFunction(c.success) ? c.success :
                       noop),
            failure = (l.isFunction(c.failure) ? c.failure : noop),
            pattern = (l.type(c.pattern) === 'regexp' ? c.pattern :
                       Y.jsonp.pattern),
            proxy   = Y.guid().replace(/-/g,'_');

        // add in the proxy method string to the URL
        url = url.replace(pattern, "YUI."+proxy);

        // Temporary un-sandboxed function alias
        YUI[proxy] = success;

        // Use the YUI instance's Get util to add the script and trigger the
        // callback.
        YUI({ modules: { _ : { fullpath : url } } }).
        use('_', function(X,res) {
            delete YUI[proxy];
            Y.jsonp.clean(url);
            if (!res.success) {
                failure(url);
            }
        });

        return this;
    };

    /**
     * Default RegExp used to insert the generated callback name into the JSONP
     * url.
     *
     * @member pattern
     * @type RegExp
     * @static
     */
    Y.jsonp.pattern = /{callback}/i;

    /**
     * Method used internally on completion of the JSONP request to purge the
     * added script node.
     *
     * @method clean
     * @param url {String} the url of the script facilitating the JSONP request
     * @protected
     * @static
     */
    Y.jsonp.clean = function (url) {
        // Workaround for Selector bug 2525942
        //var script = Y.get('head > script[src='+url+']');
        var script = Y.all('head > script[src]'),i,n;

        if (script) {
            //script.get('parentNode').removeChild(script);
            for (i = script.size() - 1; i >= 0; --i) {
                n = script.item(i);
                if (n.get('src') === url) {
                    n.get('parentNode').removeChild(n);
                    break;
                }
            }
        } else {
            Y.log("Error locating JSONP script node for deletion","warn","jsonp");
        }
    };

},'@VERSION',{requires:'node'});
