;(function() {
    if(!Array.prototype.indexOf) {
        Array.prototype.indexOf = function(target, start) {
            for(var i = (start || 0), len = this.length; i < len; i++) {
                if(this[i] === target) {
                    return i;
                }
            };
            return -1;
        }
    }

    function _extend(prev, add) {
        var result = prev || {},
            i;
        for(i in add) {
            if(add.hasOwnProperty(i)) {
                result[i] = add[i];
            }
        }
        return result;
    }

    function _getBoundingClientRect(elem) {
        var temp = document.createElement('div'),
            tempTop,
            tempLeft;
        temp.style.cssText = 'position: absolute; top: 0; left: 0';
        document.body.appendChild(temp);
        tempTop = temp.getBoundingClientRect().top;
        tempLeft = temp.getBoundingClientRect().left;
        document.body.removeChild(temp);
        temp = null;
        return {
            top: elem.getBoundingClientRect().top - tempTop,
            left: elem.getBoundingClientRect().left - tempLeft,
            bottom: elem.getBoundingClientRect().bottom - tempTop,
            right: elem.getBoundingClientRect().right - tempLeft
        }
    }

    function _toCamelCase(str) {
        return str.replace(/-([\da-z])/gi, function(all, letter) {
            return (letter + "").toUpperCase();
        });
    }
    function _toDashCase(str) {
        return str.replace(/([A-Z])/g, '-$1').toLowerCase();
    }
    function _checkCSSFloat() {
        var div = document.createElement('div');
        div.style.cssText = 'float:left';
        return !!div.style.cssFloat ? 'cssFloat' : 'styleFloat';
    }
    function _getStyle(elem, name) {
        var inlineName = name === 'float' ? _checkCSSFloat() : _toCamelCase(name),
            oriName = _toDashCase(name);
        if(elem.style.inlineName) {
            return elem.style[inlineName];
        } else if(document.defaultView && document.defaultView.getComputedStyle) {
            return document.defaultView.getComputedStyle(elem, null).getPropertyValue(oriName);
        } else if(elem.currentStyle) {
            return elem.currentStyle[inlineName];
        } else {
            return null;
        }
    }

    function _setStyle(elem, cssObject) {
        var name,
            inlineName,
            oriName;
        for(name in cssObject) {
            if(cssObject.hasOwnProperty(name)) {
                inlineName = (name === 'float') ? _checkCSSFloat() : _toCamelCase(name);
                elem.style[inlineName] = cssObject[name];
            }
        }
    }

    function _addEvent(elem, type, fn) {
        if(document.addEventListener) {
            elem.addEventListener(type, fn, false);
        } else if(document.attachEvent) {
            elem.attachEvent('on' + type, function(e) {
                e.preventDefault = function() {
                    e.returnValue = false;
                };
                e.stopPropagation = function() {
                    e.cancelBubble = true;
                };
                fn.call(elem, e);
            });
        }
    }

    var ie = (function(){
        var undef,
            v = 3,
            div = document.createElement('div'),
            all = div.getElementsByTagName('i');
        while (
            div.innerHTML = '<!--[if gt IE ' + (++v) + ']><i></i><![endif]-->',
            all[0]
        );
        return v > 4 ? v : undef;
    }());

    function Placeholder(options) {
        var defaultOptions = {
            placeholderColor: '#888',
            paddingLeft: 3,
            // valueFocusEmpty valueInputEmpty labelFocusEmpty labelInputEmpty
            // now support labelFocusEmpty labelInputEmpty
            // recommand labelFocusEmpty
            type: 'labelFocusEmpty'
        };
        this.options = _extend(defaultOptions, options || {});
        this.placeholderPuppet;
        this.focusTimer;
        // ban esc up down left right
        this.banKeyCode = [27, 37, 38, 39, 40];
        this.init();
    }

    Placeholder.prototype.init = function() {
        var inputElem = this.options.inputElem,
            placeholderPuppet,
            self = this;

        if(inputElem && !('placeholder' in document.createElement('input')) && (inputElem.getAttribute('placeholder')) ) {

            this.createPlaceholderPuppet();
            placeholderPuppet =  this.placeholderPuppet;

            switch(this.options.type) {
                case 'labelInputEmpty':
                    _addEvent(placeholderPuppet, 'click', function() {
                        inputElem.focus();
                    });
                    // 1. interval 方法
                    /*_addEvent(inputElem, 'focus', function() {
                        self.clearTimer();
                        if(!inputElem.value) {
                            self.setTimer();
                        }
                    });
                    _addEvent(inputElem, 'keyup', function() {
                        if(inputElem.value) {
                            self.clearTimer();
                            self.hidePlaceholderPuppet();
                        } else {
                            self.setTimer();
                            self.showPlaceholderPuppet();
                        }
                    });
                    _addEvent(inputElem, 'blur', function() {
                        self.clearTimer();
                        if(inputElem.value) {
                            self.hidePlaceholderPuppet();
                        } else {
                            self.showPlaceholderPuppet();
                        }
                    });*/
                    // 2. 传统的对 keyup 的监听，有右键复制后 placeholder 不消失的问题，但是性能稍好
                    /*_addEvent(inputElem, 'keydown', function(e) {
                        var event = e || window.event;
                        if(self.banKeyCode.indexOf(event.keyCode) === -1) {
                            self.hidePlaceholderPuppet();
                        }
                    });
                    _addEvent(inputElem, 'contextmenu', function() {
                    });
                    _addEvent(inputElem, 'keyup', function() {
                        self.checkInputEmpty();
                    });
                    _addEvent(inputElem, 'blur', function() {
                        self.checkInputEmpty();
                    });*/
                    // 3. 对2进行了 fix 的方法
                    _addEvent(inputElem, 'keydown', function(e) {
                        var event = e || window.event;
                        if(self.banKeyCode.indexOf(event.keyCode) === -1) {
                            self.hidePlaceholderPuppet();
                        }
                    });
                    _addEvent(inputElem, 'keyup', function() {
                        self.checkInputEmpty();
                    });
                    _addEvent(inputElem, 'propertychange', function() {
                        self.checkInputEmpty();
                    });
                    _addEvent(inputElem, 'blur', function(e) {
                        self.checkInputEmpty();
                        if(ie == 9) {
                            if (e.type === "focus") {
                                document.addEventListener("selectionchange", function() {
                                    self.checkInputEmpty();
                                }, false);
                            } else {
                                document.removeEventListener("selectionchange", function() {
                                    self.checkInputEmpty();
                                }, false);
                            }
                        }
                    });
                    _addEvent(inputElem, 'focus', function(e) {
                        if(ie == 9) {
                            if (e.type === "focus") {
                                document.addEventListener("selectionchange", function() {
                                    self.checkInputEmpty();
                                }, false);
                            } else {
                                document.removeEventListener("selectionchange", function() {
                                    self.checkInputEmpty();
                                }, false);
                            }
                        }
                    });
                    break;
                case 'labelFocusEmpty':
                    _addEvent(placeholderPuppet, 'click', function() {
                        inputElem.focus();
                    });
                    _addEvent(inputElem, 'focus', function() {
                        self.hidePlaceholderPuppet();
                    });
                    _addEvent(inputElem, 'blur', function() {
                        self.checkInputEmpty();
                    });
                    break;
            }
            if(inputElem.value) {
                this.hidePlaceholderPuppet();
            }
        }
    };
    Placeholder.prototype.createPlaceholderPuppet = function() {
        var inputElem = this.options.inputElem,
            placeholderText = inputElem.getAttribute('placeholder');

        var inputElemHeight = _getStyle(inputElem, 'height'),
            inputElemLineHeight = _getStyle(inputElem, 'line-height'),
            inputElemFontSize = _getStyle(inputElem, 'font-size'),
            inputElemFontFamily = _getStyle(inputElem, 'font-family'),
            inputElemPaddingTop = _getStyle(inputElem, 'padding-top'),
            inputElemPaddingBottom = _getStyle(inputElem, 'padding-bottom'),
            inputElemBorderTopWidth = _getStyle(inputElem, 'borderTopWidth'),
            inputElemBorderBottomWidth = _getStyle(inputElem, 'borderBottomWidth'),
            inputElemMarginTop = _getStyle(inputElem, 'margin-top'),
            inputElemMarginBottom = _getStyle(inputElem, 'margin-bottom'),
            inputElemMarginLeft = _getStyle(inputElem, 'margin-left'),
            inputElemClientRect = _getBoundingClientRect(inputElem);

        inputElemOuterHeight = inputElemClientRect.bottom - inputElemClientRect.top;
        inputElemOuterWidth = inputElemClientRect.right - inputElemClientRect.left;

        this.placeholderPuppet = document.createElement('label');
        this.placeholderPuppet.setAttribute('for', inputElem.id || '');
        this.placeholderPuppet.innerHTML = placeholderText;

        _setStyle(this.placeholderPuppet, {
            'cursor': 'text',
            'position': 'absolute',
            'padding-left': this.options.paddingLeft + 'px',
            'width': Math.max(inputElemOuterWidth - this.options.paddingLeft, 0) + 'px',
            'height': inputElemOuterHeight + 'px',
            'line-height': inputElemOuterHeight + 'px',
            'margin-top': inputElemMarginTop,
            'margin-bottom': inputElemMarginBottom,
            'margin-left': inputElemMarginLeft,
            'color': this.options.placeholderColor,
            'font-size': inputElemFontSize,
            'font-family': inputElemFontFamily
        });

        inputElem.parentNode.insertBefore(this.placeholderPuppet, inputElem);
    };
    Placeholder.prototype.setTimer = function() {
        var inputElem = this.options.inputElem,
            self = this;
        this.focusTimer = setInterval(function() {
            self.checkInputEmpty();
        }, 100);
    };
    Placeholder.prototype.clearTimer = function() {
        if(this.focusTimer) {
            clearInterval(this.focusTimer);
        }
    };
    Placeholder.prototype.showPlaceholderPuppet = function() {
        this.placeholderPuppet.style.display = '';
    };
    Placeholder.prototype.hidePlaceholderPuppet = function() {
        this.placeholderPuppet.style.display = 'none';
    };
    Placeholder.prototype.checkInputEmpty = function() {
        if(this.options.inputElem.value) {
            this.hidePlaceholderPuppet();
        } else {
            this.showPlaceholderPuppet();
        }
    };

    window.Placeholder = Placeholder;
})();
