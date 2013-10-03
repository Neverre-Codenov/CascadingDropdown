// USE THE nn NAMESPACE
var nn = {};

/**
 * The Cascade object constructor. Responsible for creating a cascade object.
 * The Cascade object manages a JSON driven dropdown cascade. It reads a
 * JSON config file and uses the model to dynamically interact with user
 * changes. Each Cascade object requires a containing 'div' (on it's HTML page)
 * with a unique identifier. Cascading dropdown's are dynamically inserted
 * under the div based on user choices.
 *
 *
 * @param 1. containerId ~~ The id of the div container. Must be unique document wide.
 * @param 2. configURL   ~~ the URL of JSON config file.
 *
 * @constructor
 *
 */
nn.Cascade = function( containerId, configURL )
{
    this.JSON_CONFIG_REQUEST_URL =  configURL;
    this.containerId             =  containerId;
    this.data = [ "A", "B" ];
    this.depth = 0;  // TO DO: GET RID OF THIS VARIABLE
    this.path = "model";
    this.numPathSteps = 0;
    this.numCascades  = 0;
    this.selectSet;
    // Configure the model on construction...
    this.doConfig();
}

/**
 * Performs the initial configuration when Cascade is
 * constructed.
 *
 */
nn.Cascade.prototype.doConfig = function()
{
    if( XMLHttpRequest )
    {
        var xhrObj = new XMLHttpRequest();
        xhrObj.open( "GET", this.JSON_CONFIG_REQUEST_URL, false );
        try { xhrObj.send(); } catch( e ){ /*TO DO: anything?*/ };
        var responseStr = xhrObj.responseText;
        if( xhrObj.status == 200 )
            //data = eval( "(" + responseStr + ")" ); BAD...
            this.data = JSON.parse( responseStr );
        else
            console.error( "Cascade " + this.containerId + ": Error reading config." );
    }
}

/**
 * Generates the select element associated with a cascade.
 *
 * @param  1. (optionsNode). Handle to a node in the data tree to walk.
 */
nn.Cascade.prototype.generateSelect = function ( optionsNode )
{
    // Generate select
    var htmlList = document.createElement( "select" );
    htmlList.setAttribute( "id", "select_" + this.containerId + ++this.depth );
    htmlList.setAttribute( "name", "select_" + this.containerId );
    htmlList.setAttribute( "data-path", this.path );
    htmlList.classList.add("CascadedSelect");
    // CALL TO TRIGGER CASCADE UPDATE
    // Since 'doCascade' is a ~method~ on any given Cascade object you need a handle
    // to the object. Problem is 'this' changes context when in event listener function.
    // Therefore create a closure by capturing 'this' and provide to event listener as
    // handle to call doCascade method...
    var thisCascade = this;
    htmlList.addEventListener( "change", function( e ){ thisCascade.doCascade( e.currentTarget ); }, false  );
    // There doesn't seem to be a way to set a default option that is not selected.
    // The following attributes seem to work though; 'disabled' and 'selected'.
    // SEE: http://stackoverflow.com/questions/15224466/display-optgroup-label-as-initial-option
    var defaultOpt = document.createElement( "option" );
    defaultOpt.textContent = "Choose one";
    defaultOpt.setAttribute("disabled", "disabled");
    defaultOpt.setAttribute("selected", "selected");
    htmlList.appendChild( defaultOpt );

    // Iterate the object
    if( Object.prototype.toString.call( optionsNode ) === '[object Array]' )
    {
        for( var idx = 0; idx < optionsNode.length; idx ++ )
        {
            var optionElem =  document.createElement( "option" );
            optionElem.setAttribute( "value", optionsNode[ idx ] );
            optionElem.textContent = optionsNode[ idx ];
            htmlList.appendChild( optionElem );
        }
    }
    else
    {
        for( var i in optionsNode )
        {
            var optionElem =  document.createElement( "option" );
            optionElem.setAttribute( "value", i );
            optionElem.textContent = i;
            htmlList.appendChild( optionElem );
        }
    }

    document.getElementById( this.containerId ).appendChild( htmlList );
}


/**
 * Recursive function to delete CascadedSelects below a given
 * model node.
 *
 * @param 1 (modelNode) a string representing the path to the branch node from which to delete.
 *
 */
nn.Cascade.prototype.deleteCascades = function ( modelNode )
{
    this.selectSet = document.getElementsByName( "select_" + this.containerId );
    if( modelNode == undefined || modelNode === ""   )
    {
        return;
    }
    // NO DEPENDENTS TO DELETE
    if( this.path === modelNode )
    {
        return;
    }
    // THIS BREAKS THE RECURSION
    if( this.numPathSteps <= this.numCascades )
    {
        return;
    }
    // This is the recursive call. Gets us all the way down
    // to the terminal (ARRAY TYPE) nodes and we remove cascades
    // on the way back when the function stack gets poppped...
    this.numPathSteps--;
    this.deleteCascades( modelNode );
    for( var i = this.selectSet.length-1 ; i > 0; i-- )
    {
        if( this.selectSet[i].getAttribute("data-path") == this.path )
        {
            this.selectSet[i].parentNode.removeChild( this.selectSet[i] );
            //Strip off the last part of path
            var idx = this.path.lastIndexOf(".");
            this.path = this.path.substring( 0, idx );
            break;
        }
    }
}


/**
 *  Heart of the operation. This function triggers the generation
 *  of the cascaded dropdown(s).
 *
 *  @param 1 (Optional). A 'select' element from which to cascade.
 */
nn.Cascade.prototype.doCascade = function( selectTarget )
{
    var model = this.data;
    if( selectTarget )
    {
        // GET THE PATH FOR CLICKED CASCADE.
        // REMOVE DEPENDENT CASCADES (IF ANY) AND
        // GENERATE NEXT CASCADE.
        var pathToClicked = selectTarget.getAttribute( "data-path" );
        // THE MODEL STEPS ARE THE STEPS THROUGH THE MODEL TO REACH
        // THE CHANGED CASCADE DROPDOWN. THE PATH STEPS ARE THE
        // STEPS TO REACH THE LAST CASCADE IN THE LINE.
        // TO BREAK RECURSION TAKE THE DIFF BETWEEN
        // THE NUMBER OF PATH STEPS AND THE MODEL STEPS
        // WHEN PATH IS LESS THAN OR EQUAL TO MODEL YOU'RE DONE.
        this.numPathSteps  = this.path.split( ".").length;
        this.numCascades   = pathToClicked.split( "." ).length;
        // call delete cascades to recursively remove cascades dependent
        // on the one clicked (if any exist yet)
        this.deleteCascades( pathToClicked );
        var selectedOptionValue = selectTarget.options[ selectTarget.selectedIndex ].value;
        for( var j in eval( this.path ) )
        {
            if ( j == selectedOptionValue )
            {
                this.path   += "." + j;
                var deRefStr = this.evaluateModel();
                this.generateSelect( eval( deRefStr ) );
            }
        }
        return;
    }
    this.generateSelect( model );
}


/**
 * Helper function to evaluate the model at any given time. The Cascade object keeps
 * a string member representing the path through the model traversed by the user at
 * any given time (c.f., "breadcrumbs"). To operate on the model the path must be
 * evaluated. The problem is when the JSON KEYS HAVE SPACES. This function evaluates
 * the model an returns a string.
 *
 * @return {String} A string representation of the dereferencing symbol of the path to
 * the model node (ready for evaluation by eval).
 */
nn.Cascade.prototype.evaluateModel = function()
{
    var deRefStr = "";
    var buffer = this.path.split(".");
    deRefStr += buffer[0];
    for( var i = 1; i < buffer.length; i++ )
    {
        deRefStr += "[\"";
        deRefStr += buffer[i];
        deRefStr += "\"]";
    }
    return( deRefStr );
}

