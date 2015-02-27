'use strict';

angular.module('cookingBuddy20App')
  .directive('myDialog', function (recipeService, dictionService, $timeout) {
    return {
        // restrict: 'A',
        // scope: true,
        link: function(scope, element, attrs) {
            element.on('click', function(event2) {
            if ('webkitSpeechRecognition' in window) {
                //recipeService.sayHello();
                dictionService.createRecognitionObject();
                // var recognition = new webkitSpeechRecognition();
                var recognition = dictionService.recognition;
                var finished = false;
                var results;
                var interim_transcript = '';
                var final_transcript = '';
                var message = '';
                // var go_to = '';
                //var display_step = current_step + 1;
                if (dictionService.recognizing) {
                  dictionService.recognizing = false;
                  dictionService.recognition.stop();
                  return;
                }
                recognition.lang = 'en-US';
                recognition.start();
            }
            else{
                alert("not here");
            }

            recognition.onstart = function() {
                dictionService.recognizing = true;
            };
            recognition.onerror = function(event) {
                console.log(event.error);
                final_transcript = '';
            };
            recognition.onend = function() {
                if(dictionService.recognizing)
                dictionService.recognition.start();
            };

            var beginRecognition = function() {
                dictionService.recognizing = true;
                dictionService.recognition.start();
                // dictionService.beginRecognition();
            };

            var changeStepStyling = function(step, color, size) {
                document.getElementById("steps_list"+step).style.color = color;
                document.getElementById("steps_list"+step).style.fontSize = size;
            };

            var handleUtterance = function(message) {
                
                dictionService.recognizing = false;
                dictionService.recognition.stop();
                dictionService.speakMessage(message);
                // don't listen to CookingBuddy's utterance. temporary hack solution
                $timeout(beginRecognition, 6000);
            };

            var handleWatchAndListen = function() {
                scope.$watch(function(scope) { return recipeService.currentStep },
                    function(newValue, oldValue) {
                        console.log(oldValue, newValue);
                        if (newValue >= 0 && oldValue < 0){
                            // changeStepStyling(oldValue, "", "1em");
                            changeStepStyling(newValue, "red", "2em");
                        } else if (newValue >= 0 && oldValue >= 0){
                            changeStepStyling(oldValue, "", "1em");
                            changeStepStyling(newValue, "red", "2em");
                        }
                    }
                );
                scope.$digest();
            };

            var buildTranscript = function() {
                interim_transcript = '';
                results = '';
                final_transcript = '';
                for (var i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        results = event.results[i];
                        final_transcript += event.results[i][0].transcript;
                        console.log(event.results[i])
                    } else {
                        interim_transcript += event.results[i][0].transcript;
                    }
                };
            };

            // if increment is true, increment the currentStep.
            // else set currentStep to value
            var handleMatch = function(regex, value, increment) {
                if (final_transcript.match(regex)){
                    if (increment)
                        recipeService.currentStep += 1;
                    else
                        recipeService.currentStep = value;
                    message = recipeService.currRecipe.steps[recipeService.currentStep];
                    handleUtterance(message);
                };
            };

            var handleMatchIngredients = function() {
                // matches "$item in ingredients pattern: '$quantity $measurement $item'"
                var re_3 = /How (many|much) (.*) do I need/i;
                var question = final_transcript.match(re_3);
                if (question){
                    for(var j = 0; j < recipeService.currRecipe.ingredients.length; j++){
                        console.log("ingredients: " + recipeService.currRecipe.ingredients[j]);
                        if(recipeService.currRecipe.ingredients[j].toLowerCase().indexOf(question[2]) > -1) {
                            console.log("made it to a question pt 2");
                            message = "You need " + recipeService.currRecipe.ingredients[j];
                            console.log(message);
                            break;
                        }
                    }
                    handleUtterance(message);
                }
            };

            var handleMatches = function() {
                if (final_transcript != ""){
                    console.log(final_transcript);
                    
                    /* Handle regex matching */
                    handleMatch(/first/i, 0, false);
                    handleMatch(/next/i, 1, true);
                    handleMatch(/repeat/i, recipeService.currentStep, false);

                    if (recipeService.currentStep > 0)
                        handleMatch(/back/i, recipeService.currentStep-1, false);
                    
                    var re = /step (\d+)/i;
                    //var re = /step/i;
                    var go_to = final_transcript.match(re);
                    if (go_to){
                        console.log("matched")
                        handleMatch(re, go_to[1]-1, false);
                    }
                    
                    handleMatchIngredients();

                    handleWatchAndListen();

                    // checks if back keyword is in transcript && also not at the start of the recipe
                    //if (final_transcript.match(/Cooking Buddy(.*)back/i) && current_step != 0){
                    
                };
            }

            recognition.onresult = function(event) {
                buildTranscript();
                
                handleMatches();
            };
        });
        }
    };
  });