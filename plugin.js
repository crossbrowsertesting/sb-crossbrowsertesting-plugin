// Init namespace.
var cbt = {};

var m = builder.translate.locales['en'].mapping;
m.__cbt_settings = "CrossBrowserTesting Settings";
m.__cbt_username = "CrossBrowserTesting email or username";
m.__cbt_authkey = "CrossBrowserTesting auth key";
m.__cbt_lookup_api_key = "Lookup your api key";
m.__cbt_need_an_account = "Need an account - register for free!";
m.__cbt_config = "Select config / browser to test:"
m.__cbt_savedbrowserlist = "Saved browser(s) to test with:"
m.__cbt_savedbrowserlistempty = "No browsers selected.  Select a browser and press add to save browsers to list."
m.__cbt_run = "Run"
m.__cbt_run_all = "run all"
m.__cbt_faq = "more info"
m.__cbt_add = "Add"
m.__cbt_stop = "stop"
m.__cbt_close = "Close"
m.__cbt_clear = "clear"
m.__cbt_clear_all = "clear all"
m.__cbt_run_test = "Run on CrossBrowserTesting"
m.__cbt_see_all_selenium_tests = "View all selenium tests"
m.__cbt_run_test_suite = "Run Suite on CrossBrowserTesting"
m.__cbt_preparing_stop = "Preparing to stop..."
m.__cbt_runscreenshottest = "Selenium powered screenshot test"
m.__cbt_addscreenshotloginprofile = "Save current selenium script to screenshot system in order to navigate to a particular page / state before taking a screenshot"
m.__cbt_addscreenshotloginprofileinput = "Selenium script name:"
m.__save_login_profile = "Save script to screenshot advanced options page"
m.__cbt_login_profile_name_default_text = "name this profile..."
m.__cbt_seleniumtesting = "Selenium Testing"
m.__screenshot_selenium_script_saved = "Saved!  You can now select this as a selenium script under the advanced options when launching a screenshot test."
m.__cbt_untitled_script = "Untitled Script"
m.__cbt_runsingle = "Run Script"
m.__cbt_runsuite = "Run Suite"
m.__cbt_run_instructions = "Run on remote CrossBrowserTesting.com browsers"
m.__cbt_testfinishedsuccessfully = "Test finished successfully!"
m.__cbt_testfinishedunsuccessfully = "Test Failed - it did not run successfully."

var cbt_runSuite = false;  
//var run;

//
//alert("Starting up CBT !!!");
builder.registerPostLoadHook(function() {  
  //alert("Starting up CBT #2 !!!");
  builder.gui.menu.addItem('file', _t('__cbt_settings'), 'file-cbt-settings', function() { cbt.settingspanel.show(false); });

  builder.gui.menu.addItem('run', _t('__cbt_run_test'), 'run-cbt-test', function() {
    cbt.settingspanel.show(false);
  });

  builder.gui.menu.addItem('run', _t('__cbt_run_test_suite'), 'run-cbt-test-suite', function() {
    cbt.settingspanel.show(true);
  });  
})

cbt.settingspanel = {};
/** The dialog. */
cbt.settingspanel.dialog = null;


cbt.loginManager = Components.classes["@mozilla.org/login-manager;1"].getService(Components.interfaces.nsILoginManager);

cbt.loginInfo = new Components.Constructor(
  "@mozilla.org/login-manager/loginInfo;1",
  Components.interfaces.nsILoginInfo,
  "init"
);



cbt.getCredentials = function() {
  var logins = cbt.loginManager.findLogins(
    {},
    /*hostname*/      'chrome://seleniumbuilder',
    /*formSubmitURL*/ null,
    /*httprealm*/     'CrossBrowserTesting User Login'
  );
  
  for (var i = 0; i < logins.length; i++) {
    return {'username': logins[i].username, 'authkey': logins[i].password};
  }
  return {'username': "", 'authkey': ""};
};



cbt.setCredentials = function() {
  var username = jQuery('#cbt_username').val();
  var authkey = jQuery('#cbt_authkey').val();

  var logins = cbt.loginManager.findLogins(
    {},
    /*hostname*/      'chrome://seleniumbuilder',
    /*formSubmitURL*/ null,
    /*httprealm*/     'CrossBrowserTesting User Login'
  );
  
  for (var i = 0; i < logins.length; i++) {
    cbt.loginManager.removeLogin(logins[i]);
  }
  
  var loginInfo = new cbt.loginInfo(
    /*hostname*/      'chrome://seleniumbuilder',
    /*formSubmitURL*/ null,
    /*httprealm*/     'CrossBrowserTesting User Login',
    /*username*/      username,
    /*password*/      authkey,
    /*usernameField*/ "",
    /*passwordField*/ ""
  );
  cbt.loginManager.addLogin(loginInfo);
};

cbt.getSavedBrowsers = function() {
  var prefName = "extensions.seleniumbuilder.plugins.cbt.savedBrowsers";
  try {
    browsers = JSON.parse(bridge.prefManager.prefHasUserValue(prefName) ? bridge.prefManager.getCharPref(prefName) : "{}");

    for (var browserIndex = 0; browserIndex < browsers.length; browserIndex++) {
      cbt.addSavedBrowser(browsers[browserIndex].configApiName, browsers[browserIndex].browserApiName);
    }

  } catch (e) {
    return {};
  }

  
};

cbt.setSavedBrowsers = function() {
  browsers=[]
  jQuery('#cbtSavedBrowserList li').each(function(){

    savedBrowserId = this.id

    savedBrowserIdParts = savedBrowserId.split("_");
    configApiName = savedBrowserIdParts[1];
    browserApiName = savedBrowserIdParts[2];  
    
    browser = {browserApiName: browserApiName, configApiName: configApiName}   
    browsers.push(browser);
  })

  
  var prefName = "extensions.seleniumbuilder.plugins.cbt.savedBrowsers";
  try {
    bridge.prefManager.setCharPref(prefName, JSON.stringify(browsers));
  } catch (e) { /* ignore */ }
};


cbt.shutdown = function() {

};

cbt.settingspanel.show = function(runSuite, callback) {
  cbt_runSuite = runSuite;
  var credentials = cbt.getCredentials();
  if (cbt.settingspanel.open) { return; }
  cbt.settingspanel.open = true;

  var testDescription = _t('__cbt_runsingle');
  if (runSuite) {
    testDescription = _t('__cbt_runsuite');
  } 

  cbt.getConfigs( function(err, configs) {
    cbt.settingspanel.dialog =
      newNode('div', {'class': 'dialog'},
        newNode('h2', _t('__cbt_settings')),
        newNode('table', {style: 'border: none;', id: 'rc-options-table'},
          newNode('tr',
            newNode('td', _t('__cbt_username') + " "),
            newNode('td', newNode('input', {id: 'cbt_username', type: 'text', value: credentials.username, 'change': function() {
            }}))
          ),
          newNode('tr',
            newNode('td', _t('__cbt_authkey') + " "),
            newNode('td', newNode('input', {id: 'cbt_authkey', type: 'text', value: credentials.authkey})),
            newNode('td', 
              newNode('span', ' ('),
              newNode('a', {'href': 'http://crossbrowsertesting.com/account?authkey', 'target': '_blank'}, _t('__cbt_lookup_api_key')),
              newNode('span', ') ')
            )
          ),
          newNode('tr',
            newNode('td', ' '),
            newNode('td', {'colspan':'2'},
              newNode('a', {'href': 'http://crossbrowsertesting.com/freetrial', 'target': '_blank'}, _t('__cbt_need_an_account'))
            )
          )
        ),
        newNode('hr'),
        newNode('h3', _t('__cbt_runscreenshottest')),
        newNode('div', 
          newNode('span', ' '),
          newNode('span', _t('__cbt_addscreenshotloginprofile')),
          newNode('span', ' '),
          newNode('a', {'href': 'http://crossbrowsertesting.com/faq/can-i-use-selenium-script-screenshot-system', 'target': '_blank'}, _t('__cbt_faq'))          
        ),
        newNode('div', 
          newNode('span', ' '),
          newNode('span', _t('__cbt_addscreenshotloginprofileinput')),
          newNode('span', ' '),
          newNode('input', {id: 'cbt_login_profile_name', type: 'text', value: _t('__cbt_login_profile_name_default_text'), 'change': function() {
            }}),
          newNode('span', ' '),
          newNode('a', {'href': '#', 'class': 'button', 'id': 'cbt-cancel', 'click': function() {
            cbt.saveLoginProfile();
            }}, _t('__save_login_profile')
          ) 
        ),
        newNode('hr'),
        newNode('h3', _t('__cbt_seleniumtesting') + ' - ' + testDescription),
        newNode('div',
          newNode('span', _t('__cbt_run_instructions')),
          newNode('span', ' | '),
          newNode('a', {'href': 'http://app.crossbrowsertesting.com/selenium/run', 'target': '_blank'}, _t('__cbt_see_all_selenium_tests')),
          newNode('span', ' | '),
          newNode('a', {'href': 'http://crossbrowsertesting.com/faq/how-do-i-record-and-run-selenium-tests-selenium-builder', 'target': '_blank'}, _t('__cbt_faq'))  
        ),
        newNode('div', 
          newNode('table', {style: 'border: none; margin-left: 20px; margin-bottom: 20px; background-color: ddd; width:90%', id: 'browserlisttable'},
            newNode('tr',
              newNode('td', {style: 'font-weight:bold'}, _t('__cbt_savedbrowserlist'))
            ),
            newNode('tr',
              newNode('td', 
                newNode('div', {'id' : 'cbtSavedBrowserListEmpty'}, _t('__cbt_savedbrowserlistempty')),
                newNode('ul', {'id' : 'cbtSavedBrowserList'}),
                newNode('div', {'id' : 'cbtSavedBrowserListRunAllControls'}, '')
              )
            )
          )
        ),
        newNode('div', _t('__cbt_config')),
        newNode('div',{'id': 'cbtImmediateRun'},
          newNode('span', newNode('select', {'id': 'cbtConfigList', 'change': function() { cbt.configSelected(configs, jQuery('#cbtConfigList').val()) }}),
            newNode('select', {'id': 'cbtBrowserList'}),
            newNode('a', {'style': 'margin: 10px;', 'href': '#', 'id': 'cbtImmediateRun_run', 'click': function() {
                var configApiName = jQuery('#cbtConfigList').val();
                var browserApiName = jQuery('#cbtBrowserList').val();
                var elementResults = '#cbtImmediateRun_status'
                var browser={browserApiName: browserApiName, configApiName:configApiName, elementResults:elementResults }
                
                if (runSuite) {
                  browsers=[]
                  browsers.push(browser)
                  cbt.runAllTests(browsers);
                } else {
                  cbt.runTest(browser);
                }
              }}, _t('__cbt_run')
            ),
            newNode('a', {'style': 'margin: 10px;', 'href': '#', 'id': 'cbtImmediateRun_add', 'click': function() {
                var configApiName = jQuery('#cbtConfigList').val();
                var browserApiName = jQuery('#cbtBrowserList').val();
                cbt.addSavedBrowser(configApiName, browserApiName);

              }}, _t('__cbt_add')
            )
          )
        ),
        newNode('div', {'style': 'display: none', 'id': 'cbtImmediateRun_status'}, ""),        
        newNode('div', {style: 'margin-top:20px;'},
          //newNode('a', {'href': '#', 'class': 'button', 'id': 'cbt-ok', 'click': function() {
            ////var username = jQuery('#cbt_username').val();
            ////var authkey = jQuery('#cbt_authkey').val();
            ////cbt.setCredentials(username, authkey);
            //cbt.setCredentials();
            //cbt.setSavedBrowsers();
            //cbt.settingspanel.hide();
          //}}, _t('ok')),
          newNode('a', {'href': '#', 'class': 'button', 'id': 'cbt-cancel', 'click': function() {
            cbt.setCredentials();
            cbt.setSavedBrowsers();
            cbt.settingspanel.hide();
            }}, _t('__cbt_close')
          ) 
        )   
      );
    builder.dialogs.show(cbt.settingspanel.dialog);
    cbt.fillConfigs(configs);
    cbt.configSelected(configs, configs[0].api_name)
    cbt.getSavedBrowsers();
  });
};

cbt.fillConfigs = function(configs) {
  for (var i = 0; i < configs.length; i++) {
    var name = configs[i].name;
    
    jQuery('#cbtConfigList').append(newNode(
      'option',
      {'value': configs[i].api_name},
      name
    ));
  }
}


cbt.saveLoginProfile = function(callback) {
  cbt.setCredentials();
  jQuery('#edit-rc-connecting').show();

  var loginprofilename = jQuery('#cbt_login_profile_name').val();
  
  scriptJson=builder.selenium2.io.getScriptDefaultRepresentation(builder.suite.getCurrentScript());

  if (loginprofilename.toUpperCase() == _t('__cbt_login_profile_name_default_text').toUpperCase() || loginprofilename.length==0) {
    alert('You must enter a name of the login profile you want this selenium script stored under')
    return;
  }

  var data = {
    "profile_name": loginprofilename,
    "custom_script": scriptJson
  };

  jQuery.ajax({
    beforeSend: function(xhr){ 
      xhr.setRequestHeader('Authorization', 'Basic ' + btoa(jQuery('#cbt_username').val() + ":" + jQuery('#cbt_authkey').val())); 
    },
    url: 'https://app.crossbrowsertesting.com/api/v3/screenshots/loginprofiles',
    type: 'POST',
    data: data,
    success: function(loginProfile) {
      jQuery('#edit-rc-connecting').hide();
      alert(_t('__screenshot_selenium_script_saved'))
      callback(true)
    },
    error: function(jqXHR, textStatus, errorThrown){ 
      jQuery('#edit-rc-connecting').hide();
      alert('Error saving login profile. Error: '+textStatus)
     
      jQuery('#edit-rc-connecting').show();
      callback(false);
    }
    
  });
};


cbt.configSelected = function(configs, configApiName) {
  //clear the list
  jQuery('#cbtBrowserList').html("");
  for (var i = 0; i < configs.length; i++) {
    if (configs[i].api_name == configApiName ) {
      var browsers = configs[i].browsers;
      for (var j = 0; j < browsers.length; j++) {
        var name = browsers[j].name;
      
        jQuery('#cbtBrowserList').append(newNode(
          'option',
          {'value': browsers[j].api_name},
          name
        ));
      }
    }
  }
}


cbt.settingspanel.hide = function() {
  jQuery(cbt.settingspanel.dialog).remove();
  cbt.settingspanel.dialog = null;
  cbt.settingspanel.open = false;
};


cbt.escapePeriodsInSelectors = function(selector) {
  return selector.replace(".", "\\.")
}

cbt.runTest = function(run, callback) {

  cbt.setCredentials();

  var configApiName = run.configApiName;
  var browserApiName = run.browserApiName;
  var elementResults = run.elementResults;
  var name = run.name;

  builder.views.script.clearResults(); 

  var browserName = "internet explorer";
  if (browserApiName.toUpperCase().indexOf("FF") > -1) browserName = "firefox";
  if (browserApiName.toUpperCase().indexOf("CHROME") > -1) browserName = "chrome";
  if (browserApiName.toUpperCase().indexOf("OPERA") > -1) browserName = "opera";
  if (browserApiName.toUpperCase().indexOf("SAFARI") > -1) browserName = "safari";


  builder.suite.switchToScript(run.index);

  var runName = _t('__cbt_untitled_script');
  //if running a suite and saving state between scripts (ie same config), name the test the suite name, not the script name
  if (cbt_runSuite && builder.doShareSuiteState()) {
    if (builder.suite.path) {
      runName = builder.suite.path.path.split("/");
      runName = runName[runName.length - 1];
      runName = runName.split(".")[0];
    } 
  } else {
    if (builder.getScript().path) {
      runName = builder.getScript().path.path.split("/");
      runName = runName[runName.length - 1];
      runName = runName.split(".")[0];
    }     
  }

  var settings = {
    hostPort: jQuery('#cbt_username').val() + ":" + jQuery('#cbt_authkey').val() + "@hub.crossbrowsertesting:80",
    browser_api_name: browserApiName,
    browserName: browserName,
    os_api_name: configApiName,
    record_video: "true",
    browserstring: browserName,
    name: runName
  };

  var elementResultsBase = elementResults.replace('_status','');
  

  jQuery.ajax(
    "https://" + jQuery('#cbt_username').val() + ":" + jQuery('#cbt_authkey').val() + "@app.crossbrowsertesting.com/api/v3/account",
    {
      "headers": {"Authorization": "Basic " + btoa(jQuery('#cbt_username').val() + ":" + jQuery('#cbt_authkey').val())},
      success: function(accountInfo) {
        //builder.suite.switchToScript(run.index);
        builder.stepdisplay.update();

        if (builder.suite.getCurrentScript().seleniumVersion == builder.selenium1) {
          alert("CrossBrowserTesting.com support begins with Selenium 2.  Please convert your script to Selenium 2 and run it.")
        } else {  

          //need run.seleniumVersion set so stop works
          run.seleniumVersion = builder.getScript().seleniumVersion;      

          if(document.getElementById(elementResultsBase.replace('#', '')+'_stop')) {
            jQuery(cbt.escapePeriodsInSelectors(elementResultsBase)+'_stop').remove();
          }
          if(document.getElementById(elementResultsBase.replace('#', '')+'_view')) {
            jQuery(cbt.escapePeriodsInSelectors(elementResultsBase)+'_view').remove();
          }
          if(document.getElementById(elementResultsBase.replace('#', '')+'_clear')) {
            jQuery(cbt.escapePeriodsInSelectors(elementResultsBase)+'_clear').remove();
          }        

          var postRunCallback = function (runResult) {
           
            run.complete = true;

            var score = 'pass';

            if (!runResult.success) {
              score = 'fail'
            }

            data = {"action": "set_score",
                  "score":score};
            
            jQuery.ajax("https://" + jQuery("#cbt_username").val() + ":" + jQuery("#cbt_authkey").val() + "@app.crossbrowsertesting.com/api/v3/selenium/" + run.sessionId, {
              "headers": {"Authorization": "Basic " + btoa(jQuery('#cbt_username').val() + ":" + jQuery('#cbt_authkey').val())},
              "type": "PUT",
              "contentType": "application/json",
              "data": JSON.stringify(data)
            });


            var finishedMessage = _t('__cbt_testfinishedsuccessfully')
            if (! runResult.success) {
              finishedMessage = _t('__cbt_testfinishedunsuccessfully') + " Error: " + runResult.errormessage
              jQuery(cbt.escapePeriodsInSelectors(elementResults)).css("background-color", "red")
            }
            jQuery(cbt.escapePeriodsInSelectors(elementResults)).html("Run finished.  Results:" + finishedMessage);
            jQuery(cbt.escapePeriodsInSelectors(elementResultsBase)+'_stop').remove();

            if ( ! jQuery(cbt.escapePeriodsInSelectors(elementResultsBase)+'_clear').length) {
              jQuery(cbt.escapePeriodsInSelectors(elementResultsBase)).append(
                newNode('a', {'id': elementResultsBase.replace('#','')+'_clear', 'href': '#', 'style':'padding-left:10px;', 'click': function() { 
                    cbt.clearElements(elementResultsBase);
                  }}, _t('__cbt_clear'))
              );
            }

            builder.views.script.onEndRCPlayback(); 

            //show all the elements with an id starting with cbt and ending with _run (ie all the run links....)
            jQuery("[id^='cbt']:[id$='_run']").show();
            //jQuery(cbt.escapePeriodsInSelectors(elementResultsBase)+'_run').show();
            jQuery(cbt.escapePeriodsInSelectors(elementResultsBase)+'_del').show();

            if (callback) {
              callback(runResult);
            }
          };
          
          var jobStartedCallback = function(response) {

            builder.views.script.onConnectionEstablished();

            //response is null when it is a rerun with the same session
            if (response) {
              run.sessionId = response.sessionId;
            } else {
              //if this was a continuation of a previous run, then response will be null.
              if (run.prevRun) {
                run.sessionId = run.prevRun.playbackRun.sessionID;
              }
            }
            jQuery(cbt.escapePeriodsInSelectors(elementResults)).show();

      
            var elementResultsBase = elementResults.replace('_status','');
            jQuery(cbt.escapePeriodsInSelectors(elementResultsBase)+'_run').hide();
            jQuery(cbt.escapePeriodsInSelectors(elementResultsBase)+'_del').hide();
            jQuery(cbt.escapePeriodsInSelectors(elementResultsBase)).append(
              newNode('a', {'id': elementResultsBase.replace('#','')+'_view', 'href': '#', 'style':'padding-left:10px;', 'click': function() { window.open("http://app.crossbrowsertesting.com/selenium/"+response.sessionId); }}, 'view')
            );
                     
           
            var path = _t('__cbt_untitled_script');
            if (builder.getScript().path) {
              var path = builder.getScript().path.path.split("/");
              path = path[path.length - 1];
              path = path.split(".")[0];
            }          
            
            //var path = builder.suite.hasScript() ? builder.getScript().path.path : null;
            jQuery(cbt.escapePeriodsInSelectors(elementResults)).html("Starting to run "+path);
            jQuery(cbt.escapePeriodsInSelectors(elementResults)).css("background-color", "#BFEE85")
          };
         
          //var stepStateCallback = builder.stepdisplay.updateStepPlaybackState;

          stepStateCallback = function(r, script, step, stepIndex, state, message, error, percentProgress) {
            if (error) {
              if (r.currentStepIndex === -1) {
                // If we can't connect to the server right at the start, just attach the error message to the
                // first step.
                r.currentStepIndex = 0;
              }
              if (!step) {
                step = script.steps[r.currentStepIndex];
              }
            } 

            builder.stepdisplay.updateStepPlaybackState(r, script, step, stepIndex, state, message, error, percentProgress);
          };



          jQuery(cbt.escapePeriodsInSelectors(elementResults)).show();
          jQuery(cbt.escapePeriodsInSelectors(elementResults)).css("background-color", "yellow");
          jQuery(cbt.escapePeriodsInSelectors(elementResults)).html("Launching configuration at CrossBrowserTesting.com...");

          var initialVars = run.initialVars;


          var pausedCallback =builder.views.script.onPauseRCPlayback;
          var preserveRunSession = run.preserveRunSession;

          if (run.reuseSession) {

            run.playbackRun = builder.selenium2.rcPlayback.runReusing(
              run.prevRun.playbackRun,
              postRunCallback,
              jobStartedCallback,
              stepStateCallback,
              initialVars,
              pausedCallback,
              preserveRunSession
            );

          } else {
            run.playbackRun = builder.selenium2.rcPlayback.run(
              settings,
              postRunCallback,
              jobStartedCallback,
              stepStateCallback,
              initialVars,
              pausedCallback,
              preserveRunSession
            );
          }

          //hide all the elements with an id starting with cbt and ending with _run (ie all the run links....)
          jQuery("[id^='cbt']:[id$='_run']").hide();

          jQuery(cbt.escapePeriodsInSelectors(elementResultsBase)+'_del').hide();
          jQuery(cbt.escapePeriodsInSelectors(elementResultsBase)).append(
            newNode('a', {'id': elementResultsBase.replace('#', '')+'_stop', 'href': '#', 'style':'padding-left:10px;', 'click': function() { 
                  jQuery(cbt.escapePeriodsInSelectors(elementResults)).html(_t('__cbt_preparing_stop'));
                  jQuery(cbt.escapePeriodsInSelectors(elementResultsBase)+'_stop').remove();
                  run.preserveRunSession = false;
                  run.playbackRun.preserveRunSession = false;
      
                  //kill this run and any pending runs
                  cbt.runall.runIndex=cbt.runall.length;
                  builder.selenium2.rcPlayback.stopTest(run);
                  builder.selenium2.rcPlayback.shutdown(run);

                  if (run.playbackRun) {
                    run.seleniumVersion.rcPlayback.stopTest(run.playbackRun);
                    builder.selenium2.rcPlayback.shutdown(run.playbackRun);
                  }
                }
              }, _t('__cbt_stop'))
          );
        }
      },
      error: function(xhr, textStatus, errorThrown) {
        jQuery('#edit-rc-connecting').hide();
        jQuery(cbt.escapePeriodsInSelectors(elementResults)).css("background-color", "red")
        jQuery(cbt.escapePeriodsInSelectors(elementResults)).html("Could not login.  Results:" + errorThrown); 
      }
    }
  );
}

cbt.clearElements = function(elementResultsBase) {
  jQuery(cbt.escapePeriodsInSelectors(elementResultsBase)+'_view').remove()
  jQuery(cbt.escapePeriodsInSelectors(elementResultsBase)+'_clear').remove()
  jQuery(cbt.escapePeriodsInSelectors(elementResultsBase)+'_status').html('')
  jQuery(cbt.escapePeriodsInSelectors(elementResultsBase)+'_status').hide('')
  builder.views.script.clearResults();

}

cbt.addSavedBrowser = function(configApiName, browserApiName) {
  //cbtSavedBrowsers

  //populate cbtSavedBrowserListRunAllControls if this is the first element added
  if ( ! jQuery("#cbtSavedBrowserList").has("li").length) {
    jQuery('#cbtSavedBrowserListRunAllControls').append(
      newNode('a', {'id':'cbtSavedBrowserList_run', 'href': '#', 'style':'padding-left:10px;', 'click': function() { cbt.runAllSavedBrowsers(); }}, _t('__cbt_run_all'))  
    );    
  }

  var name = cbt.getSavedBrowserId(configApiName, browserApiName);
  //add this browser as long as it does not already exist
  if(! document.getElementById(name)) {
    jQuery('#cbtSavedBrowserListEmpty').hide();

    jQuery('#cbtSavedBrowserList').append(newNode('li', {'id': cbt.getSavedBrowserId(configApiName, browserApiName)},
        newNode('div',
          newNode('span', configApiName+" "+browserApiName),
          newNode('a', {'id': cbt.getSavedBrowserId(configApiName, browserApiName)+'_run', 'href': '#', 'style':'padding-left:10px;', 'click': function() { cbt.runSavedBrowser(cbt.getSavedBrowserId(configApiName, browserApiName)); }}, _t('__cbt_run')),
          newNode('a', {'id': cbt.getSavedBrowserId(configApiName, browserApiName)+'_del', 'href': '#', 'style':'padding-left:10px;', 'click': function() {cbt.delSavedBrowser(this)}}, 'x')
        ),
        newNode('div', {'id': cbt.getSavedBrowserId(configApiName, browserApiName)+'_status', 'style':'display:none'},'')
      )
    );
  }
}

cbt.delSavedBrowser = function(element) {
  jQuery(element).parent().parent().remove(); 
  if ( ! jQuery("#cbtSavedBrowserList").has("li").length) {
    jQuery('#cbtSavedBrowserListEmpty').show();
  }

  //remove cbtSavedBrowserListRunAllControls if this is the first element added
  if ( ! jQuery("#cbtSavedBrowserList").has("li").length) {
    jQuery('#cbtSavedBrowserList_run').remove()   
  }

}


cbt.runSavedBrowser = function(savedBrowserId) {

  var savedBrowserIdParts = savedBrowserId.split("_");
  var configApiName = savedBrowserIdParts[1];
  var browserApiName = savedBrowserIdParts[2];
  var run = {browserApiName: browserApiName, configApiName: configApiName, elementResults: '#'+savedBrowserId+'_status' }
  if (cbt_runSuite) {
    var browsers = []
    browsers.push(run);
    cbt.runAllTests(browsers)
  } else {
    cbt.runTest(run);
  }
}


cbt.runAllSavedBrowsers = function() {

  //first, lets save the current list:
  cbt.setSavedBrowsers();

  //build a browsers array
  var browsers = [];
  jQuery('#cbtSavedBrowserList li').each(function(){

    savedBrowserId = this.id

    //clean up ui
    if ( jQuery('#'+cbt.escapePeriodsInSelectors(savedBrowserId)+'_clear').length) {
      cbt.clearElements('#'+savedBrowserId);
    }

    
    savedBrowserIdParts = savedBrowserId.split("_");
    configApiName = savedBrowserIdParts[1];
    browserApiName = savedBrowserIdParts[2];  
    
    run = {browserApiName: browserApiName, configApiName: configApiName, elementResults: '#'+savedBrowserId+'_status' }   
    browsers.push(run);
  })
  cbt.runAllTests(browsers);

}

cbt.clearAllSavedBrowsers = function() {
  jQuery('#cbtSavedBrowserList li').each(function(){

    savedBrowserId = this.id

    //clean up ui
    if ( jQuery('#'+cbt.escapePeriodsInSelectors(savedBrowserId)+'_clear').length) {
      cbt.clearElements('#'+savedBrowserId);
    }
  })
  jQuery('#cbtSavedBrowserList_clear').remove()
  console.log("cleared")
}


cbt.getSavedBrowserHtml = function(configs, configApiName, browserApiName) {
  return("<li id='"+cbt.getSavedBrowserId(configApiName, browserApiName)+"'>"+configApiName+" "+browserApiName+"<\li>");
}

cbt.getSavedBrowserId = function(configApiName, browserApiName) {
  return("cbt_"+configApiName+"_"+browserApiName);
}


cbt.getConfigs = function(callback) {
  jQuery.ajax(
    "https://app.crossbrowsertesting.com/api/v3/selenium/browsers",
    {
      success: function(configs) {
        callback(true, configs)
      },
      error: function() {
        callback(false, null);
      }
    }
  );
};

cbt.runall = {};
cbt.runall.scriptNames = [];
cbt.runall.runs = [];


cbt.runAllTests = function(browsers) {
  jQuery('#edit-suite-editing').hide();
  
  var scripts = [];
  var scriptIndexes = [];
  
  var isSel2orLater = true;
  if (cbt_runSuite) {
    for (var i = 0; i < builder.suite.getScriptNames().length; i++) {
      scriptIndexes.push(i); 
      if (builder.suite.scripts[i].seleniumVersion == builder.selenium1) {
        isSel2orLater = false;
      }
    }
    scripts = builder.suite.scripts;
  } else {
    scriptIndexes = [builder.suite.getSelectedScriptIndex()];
    scripts = [builder.getScript()];
  }

  if ( ! isSel2orLater ) {
    alert("CrossBrowserTesting.com support begins with Selenium 2.  Please convert your scripts to Selenium 2 and run them.")
  } else {

    cbt.runall.scriptNames = builder.suite.getScriptNames();
    builder.dialogs.runall.getAllRows(scripts, function(scriptsIndexToRows) {
      cbt.runall.runs = [];
      
      var runIndex = 0;
      var prevRun = null;
      
      for (var browserIndex = 0; browserIndex < browsers.length; browserIndex++) {
        for (var scriptIndex = 0; scriptIndex < scriptIndexes.length; scriptIndex++) {
          var script = builder.suite.scripts[scriptIndexes[scriptIndex]];
          if (script.seleniumVersion != builder.selenium2) { continue; }
          var rows = scriptsIndexToRows[scriptIndex];
          for (var rowIndex = 0; rowIndex < rows.length; rowIndex++) {
            var row = rows[rowIndex];
            var name = cbt.runall.scriptNames[scriptIndexes[scriptIndex]] + " " + browsers[browserIndex].browserApiName;
            if (rows.length > 1) {
              name += " " + _t('row', rowIndex);
            }
            var firstSuiteRun = scriptIndex == 0 && rowIndex == 0;
            var lastSuiteRun = scriptIndex == scriptIndexes.length - 1 && rowIndex == rows.length - 1;
            var new_run = {
              'name': name,
              'script': script,
              /*'settings': settings.sel2[settingsIndex],*/
              'browserApiName': browsers[browserIndex].browserApiName,
              'configApiName': browsers[browserIndex].configApiName,
              'elementResults': browsers[browserIndex].elementResults,
              'index': scriptIndexes[scriptIndex],
              'sessionId': null,
              'complete': false,
              'runIndex': runIndex++,
              'playbackRun': null,
              'seleniumVersion': script.seleniumVersion,
              'stopRequested': false,
              'initialVars': row,
              'prevRun': prevRun,
              'reuseSession': builder.doShareSuiteState() && !firstSuiteRun,
              'preserveRunSession': builder.doShareSuiteState() && !lastSuiteRun
            };
            prevRun = new_run;
            cbt.runall.runs.push(new_run);
          }
        }
        prevRun = null;
      }

      cbt.runall.runIndex=-1;
      //cbt.runall.runNext(configApiName, browserApiName);
      cbt.runall.runNext();

    })
  }
}  



//cbt.runall.runNext = function(configApiName, browserApiName) {
  cbt.runall.runNext = function() {
 
  cbt.runall.runIndex++;
  if (cbt.runall.runIndex < cbt.runall.runs.length )  {
    configApiName = cbt.runall.runs[cbt.runall.runIndex].configApiName;
    browserApiName = cbt.runall.runs[cbt.runall.runIndex].browserApiName;
    cbt.runall.runScript(configApiName, browserApiName, cbt.runall.runs.indexOf(cbt.runall.runs[cbt.runall.runIndex]));
  } else {
    if ( jQuery("#cbtSavedBrowserList_clear").length == 0 ) {
      //if ( ! jQuery("#cbtSavedBrowserList") ) {
        jQuery('#cbtSavedBrowserListRunAllControls').append(
         newNode('a', {'id':'cbtSavedBrowserList_clear', 'href': '#', 'style':'padding-left:10px;', 'click': function() { cbt.clearAllSavedBrowsers(); }}, _t('__cbt_clear_all'))  
        );    
      //}
    }
  }
};

cbt.runall.processResult = function(result, configApiName, browserApiName, runIndex ) {
  cbt.runall.runs[runIndex].complete = true;
  cbt.runall.runNext(configApiName, browserApiName);
};


cbt.runall.runScript = function(configApiName, browserApiName,runIndex) {
  jQuery("#script-num-" + runIndex).css('background-color', '#ffffaa');
  
  cbt.runTest(cbt.runall.runs[runIndex], function(result) { cbt.runall.processResult(result, configApiName, browserApiName, runIndex); });
};


var to_add = [];
for (var name in builder.selenium2.io.lang_infos) {
  if (name.startsWith && name.startsWith("Java") && name.toLowerCase().indexOf('On Demand')==-1 ) {
    to_add.push(name);
  }
}


/*
function createDerivedInfo(name) {

  builder.selenium2.io.addDerivedLangFormatter(name, {
    name: name + "/CrossBrowserTesting On Demand",
    get_params: function(script, callback) { cbt.settingspanel.show(false, callback); },
    extraImports:
      "import java.net.URL;\n" +
      "import org.openqa.selenium.remote.DesiredCapabilities;\n" +
      "import org.openqa.selenium.remote.RemoteWebDriver;\n",
    driverVar:
      "RemoteWebDriver wd;",
    initDriver:
      "wd = new RemoteWebDriver(\n" +
      "    new URL(\"http://" + jQuery('#cbt_username').val() + ":" + jQuery('#cbt_authkey').val() + "@hub.crossbrowsertesting.com:80/wd/hub\"),\n" +
      "    caps);"
  });  
};
for (var i = 0; i < to_add.length; i++) {
  createDerivedInfo(to_add[i]);
}
*/