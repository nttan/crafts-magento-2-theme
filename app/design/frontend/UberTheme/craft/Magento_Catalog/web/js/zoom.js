/**
 * Magento
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Academic Free License (AFL 3.0)
 * that is bundled with this package in the file LICENSE_AFL.txt.
 * It is also available through the world-wide-web at this URL:
 * http://opensource.org/licenses/afl-3.0.php
 * If you did not receive a copy of the license and are unable to
 * obtain it through the world-wide-web, please send an email
 * to license@magentocommerce.com so we can send you a copy immediately.
 *
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade Magento to newer
 * versions in the future. If you wish to customize Magento for your
 * needs please refer to http://www.magentocommerce.com for more information.
 *
 * @copyright   Copyright (c) 2014 X.commerce, Inc. (http://www.magentocommerce.com)
 * @license     http://opensource.org/licenses/afl-3.0.php  Academic Free License (AFL 3.0)
 */
/*jshint browser:true jquery:true expr:true*/
define([
    "jquery",
    "jquery/ui"
], function($){

    $.widget('mage.zoom', {
        options: {
            sliderSpeed: 10
        },

        _create: function() {
            this.sliderMax = $(this.options.sliderSelector).width();
            this.image = this.element;
            this.imageWidth = this.image.width();
            this.imageHeight = this.image.height();
            this.imageParent = this.image.parent();
            this.imageParentWidth = this.imageParent.width();
            this.imageParentHeight = this.imageParent.height();
            this.showFullImage = false;

            if (!this._isZoomable()) {
                return;
            }
            this._initialResize();

            // Slide slider to zoom in or out the picture
            this.slider = $(this.options.sliderSelector).slider({
                value: 0,
                min: 0,
                max: this.sliderMax,
                slide: $.proxy(function(event, ui) {
                    this._zoom(ui.value, this.sliderMax);
                }, this),
                change: $.proxy(function(event, ui) {
                    this._zoom(ui.value, this.sliderMax);
                }, this)
            });

            // Mousedown on zoom in icon to zoom in picture
            $(this.options.zoomInSelector).on('mousedown', $.proxy(function() {
                this.intervalId = setInterval($.proxy(function() {
                    this.slider.slider('value', this.slider.slider('value') + 1);
                }, this), this.options.sliderSpeed);
            }, this)).on('mouseup mouseleave', $.proxy(function() {
                clearInterval(this.intervalId);
            }, this));

            // Mousedown on zoom out icon to zoom out picture
            $(this.options.zoomOutSelector).on('mousedown', $.proxy(function() {
                this.intervalId = setInterval($.proxy(function() {
                    this.slider.slider('value', this.slider.slider('value') - 1);
                }, this), this.options.sliderSpeed);
            }, this)).on('mouseup mouseleave', $.proxy(function() {
                clearInterval(this.intervalId);
            }, this));

            // Double-click image to see full picture
            this.element.on('dblclick', $.proxy(function() {
                this.showFullImage = !this.showFullImage;
                var ratio = this.showFullImage ? this.sliderMax : this.slider.slider('value');
                this._zoom(ratio, this.sliderMax);
                if (this.showFullImage) {
                    $(this.options.sliderSelector).hide();
                    $(this.options.zoomInSelector).hide();
                    $(this.options.zoomOutSelector).hide();
                    this.imageParent.css({'overflow': 'visible', 'zIndex': '1000'});
                } else {
                    $(this.options.sliderSelector).show();
                    $(this.options.zoomInSelector).show();
                    $(this.options.zoomOutSelector).show();
                    this.imageParent.css({'overflow': 'hidden', 'zIndex': '9'});
                }
            }, this));

            // Window resize will change offset for draggable
            $(window).resize(this._draggableImage());
        },

        /**
         * If image dimension is smaller than parent container, disable zoom
         * @private
         */
        _isZoomable: function() {
            if (this.imageWidth <= this.imageParentWidth && this.imageHeight <= this.imageParentHeight) {
                $(this.options.sliderSelector).parent().hide();
                $(this.options.zoomNoticeSelector).hide();
                return false;
            }
            return true;
        },

        /**
         * Resize image to fit parent container and set initial image dimension
         * @private
         */
        _initialResize: function() {
            if (this.imageWidth > this.imageHeight) {
                this.ceilingZoom = this.imageWidth / this.imageParentWidth;
                this.image.width(this.imageParentWidth);
                this.image.css('top', ((this.imageParentHeight - this.image.height()) / 2) + 'px');
            } else {
                this.ceilingZoom = this.imageHeight / this.imageParentHeight;
                this.image.height(this.imageParentHeight);
                this.image.css('left', ((this.imageParentWidth - this.image.width()) / 2) + 'px');
            }
            // Remember Image original position
            this.imageInitTop = this.image.position().top;
            this.imageInitLeft = this.image.position().left;
        },

        /**
         * Make Image draggable inside parent container dimension
         * @private
         */
        _draggableImage: function() {
            var topX = this.image.offset().left,
                topY = this.image.offset().top,
                bottomX = this.image.offset().left,
                bottomY = this.image.offset().top;
            // Calculate x offset if image width is greater than image container width
            if (this.image.width() > this.imageParentWidth) {
                topX = this.image.width() - (this.imageParent.offset().left -
                    this.image.offset().left) - this.imageParentWidth;
                topX = this.image.offset().left - topX;
                bottomX = this.imageParent.offset().left - this.image.offset().left;
                bottomX = this.image.offset().left + bottomX;
            }
            // Calculate y offset if image height is greater than image container height
            if (this.image.height() > this.imageParentHeight) {
                topY = this.image.height() - (this.imageParent.offset().top -
                    this.image.offset().top) - this.imageParentHeight;
                topY = this.image.offset().top - topY;
                bottomY = this.imageParent.offset().top - this.image.offset().top;
                bottomY = this.image.offset().top + bottomY;
            }
            // containment field is used because image is larger than parent container
            this.element.draggable({
                containment: [topX, topY, bottomX, bottomY],
                scroll: false
            });
        },

        /**
         * Resize image based on slider position
         * @param sliderPosition - current slider position (0 to slider track max length)
         * @param sliderLength - slider track max length
         * @private
         */
        _zoom: function(sliderPosition, sliderLength) {
            var ratio = sliderPosition / sliderLength;
            ratio = ratio > 1 ? 1 : ratio;
            var imageOldLeft = this.image.position().left;
            var imageOldTop = this.image.position().top;
            var imageOldWidth = this.image.width();
            var imageOldHeight = this.image.height();
            var overSize = (this.imageWidth > this.imageParentWidth || this.imageHeight > this.imageParentHeight);
            var floorZoom = 1;
            var imageZoom = floorZoom + (ratio * (this.ceilingZoom - floorZoom));
            // Zoomed image is larger than container, and resize image based on zoom ratio
            if (overSize) {
                this.imageWidth > this.imageHeight ? this.image.width(imageZoom * this.imageParentWidth) :
                    this.image.height(imageZoom * this.imageParentHeight);
            } else {
                $(this.options.sliderSelector).hide();
            }
            // Position zoomed image properly
            var imageNewLeft = imageOldLeft - (this.image.width() - imageOldWidth) / 2;
            var imageNewTop = imageOldTop - (this.image.height() - imageOldHeight) / 2;
            // Image can't be positioned more left than original left
            if (imageNewLeft > this.imageInitLeft || this.image.width() < this.imageParentWidth) {
                imageNewLeft = this.imageInitLeft;
            }
            // Image can't be positioned more right than the difference between parent width and image current width
            if (Math.abs(imageNewLeft) > Math.abs(this.imageParentWidth - this.image.width())) {
                imageNewLeft = this.imageParentWidth - this.image.width();
            }
            // Image can't be positioned more down than original top
            if (imageNewTop > this.imageInitTop || this.image.height() < this.imageParentHeight) {
                imageNewTop = this.imageInitTop;
            }
            // Image can't be positioned more top than the difference between parent height and image current height
            if (Math.abs(imageNewTop) > Math.abs(this.imageParentHeight - this.image.height())) {
                imageNewTop = this.imageParentHeight - this.image.height();
            }
            this.image.css({'left': imageNewLeft + 'px', 'top': imageNewTop + 'px'});
            // Because image size and position changed, we need to recalculate draggable image containment
            this._draggableImage();
        }
    });
});