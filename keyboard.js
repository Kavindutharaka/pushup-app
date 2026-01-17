/* Custom On-Screen Keyboards for Kiosk Mode */

app.directive('customKeyboard', function () {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            var keyboardType = attrs.customKeyboard; // 'text' or 'number'
            var keyboardId = 'keyboard-' + scope.$id;

            // Create keyboard element
            var keyboard = angular.element('<div class="custom-keyboard" id="' + keyboardId + '"></div>');
            var currentInput = null;

            if (keyboardType === 'number') {
                // Number keyboard - single row
                var numberKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '⌫'];
                var numberRow = angular.element('<div class="keyboard-row"></div>');

                numberKeys.forEach(function (key) {
                    var btn = angular.element('<button class="key-btn number-key">' + key + '</button>');
                    btn.on('click', function (e) {
                        e.stopPropagation();
                        handleKeyPress(key);
                    });
                    numberRow.append(btn);
                });

                keyboard.append(numberRow);

                // Add DONE button row
                var doneRow = angular.element('<div class="keyboard-row"></div>');
                var doneBtn = angular.element('<button class="key-btn done-key">DONE</button>');
                doneBtn.on('click', function (e) {
                    e.stopPropagation();
                    hideKeyboard();
                });
                doneRow.append(doneBtn);
                keyboard.append(doneRow);

            } else if (keyboardType === 'text') {
                // Text keyboard - QWERTY layout
                var rows = [
                    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
                    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
                    ['Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫']
                ];

                rows.forEach(function (rowKeys, index) {
                    var row = angular.element('<div class="keyboard-row"></div>');

                    rowKeys.forEach(function (key) {
                        var btn = angular.element('<button class="key-btn text-key">' + key + '</button>');
                        btn.on('click', function (e) {
                            e.stopPropagation();
                            handleKeyPress(key);
                        });
                        row.append(btn);
                    });

                    keyboard.append(row);
                });

                // Space bar and DONE button row
                var spaceRow = angular.element('<div class="keyboard-row"></div>');
                var spaceBtn = angular.element('<button class="key-btn space-key">SPACE</button>');
                spaceBtn.on('click', function (e) {
                    e.stopPropagation();
                    handleKeyPress(' ');
                });

                var doneBtn = angular.element('<button class="key-btn done-key">DONE</button>');
                doneBtn.on('click', function (e) {
                    e.stopPropagation();
                    hideKeyboard();
                });

                spaceRow.append(spaceBtn);
                spaceRow.append(doneBtn);
                keyboard.append(spaceRow);
            }

            // Handle key press
            function handleKeyPress(key) {
                if (!currentInput) return;

                var inputElement = currentInput[0];
                var currentValue = inputElement.value || '';

                if (key === '⌫') {
                    // Backspace
                    inputElement.value = currentValue.slice(0, -1);
                } else {
                    // Add character
                    inputElement.value = currentValue + key;
                }

                // Trigger Angular update
                currentInput.triggerHandler('input');
                scope.$apply();
            }

            // Hide keyboard function
            function hideKeyboard() {
                keyboard.removeClass('keyboard-visible');
                currentInput = null;
                if (element[0]) {
                    element[0].blur();
                }
            }

            // Show keyboard on focus
            element.on('focus', function () {
                currentInput = element;
                keyboard.addClass('keyboard-visible');

                // Position keyboard below input
                var offset = element[0].getBoundingClientRect();
                keyboard.css({
                    'top': (offset.bottom + 20) + 'px',
                    'left': '50%',
                    'transform': 'translateX(-50%)'
                });
            });

            // Click outside to hide keyboard
            angular.element(document).on('click', function (e) {
                if (keyboard.hasClass('keyboard-visible')) {
                    var isClickInsideKeyboard = keyboard[0].contains(e.target);
                    var isClickOnInput = element[0] === e.target;

                    if (!isClickInsideKeyboard && !isClickOnInput) {
                        hideKeyboard();
                    }
                }
            });

            // Prevent default keyboard
            element.attr('readonly', 'readonly');
            element.css('cursor', 'pointer');

            // Append keyboard to body
            angular.element(document.body).append(keyboard);

            // Cleanup on destroy
            scope.$on('$destroy', function () {
                angular.element(document).off('click');
                keyboard.remove();
            });
        }
    };
});
