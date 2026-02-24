(function () {
  "use strict";

  /* ── Utility: debounce ─────────────────────────────────── */
  function debounce(fn, delay) {
    var timer;
    return function () {
      var ctx = this;
      var args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () {
        fn.apply(ctx, args);
      }, delay);
    };
  }

  /* ── Utility: toast notification ──────────────────────── */
  function showToast(message, type) {
    var existing = document.querySelector(".ag-toast");
    if (existing) existing.remove();

    var toast = document.createElement("div");
    toast.className = "ag-toast ag-toast--" + (type || "info");
    toast.setAttribute("role", "alert");
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(function () {
      toast.classList.add("is-visible");
    });

    setTimeout(function () {
      toast.classList.remove("is-visible");
      setTimeout(function () { toast.remove(); }, 350);
    }, 3500);
  }

  /* ── Utility: GA4 event helper ─────────────────────────── */
  function trackEvent(eventName, params) {
    if (typeof window.gtag === "function") {
      window.gtag("event", eventName, params || {});
    }
    if (typeof window.fbq === "function" && eventName === "add_to_cart") {
      window.fbq("track", "AddToCart", {
        content_ids: [params.items && params.items[0] && params.items[0].item_id],
        content_type: "product",
        value: params.value || 0,
        currency: params.currency || "INR"
      });
    }
    if (typeof window.fbq === "function" && eventName === "view_item") {
      window.fbq("track", "ViewContent", {
        content_ids: [params.items && params.items[0] && params.items[0].item_id],
        content_type: "product",
        value: params.value || 0,
        currency: params.currency || "INR"
      });
    }
  }

  /* ── UTM persistence ────────────────────────────────── */
  var UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];

  function captureUtmParams() {
    try {
      var params = new URLSearchParams(window.location.search);
      var found = false;
      UTM_KEYS.forEach(function (key) {
        var val = params.get(key);
        if (val) {
          sessionStorage.setItem("ag_" + key, val);
          found = true;
        }
      });
      /* If we landed with UTMs, also store the landing page */
      if (found) {
        sessionStorage.setItem("ag_utm_landing", window.location.pathname);
      }
    } catch (e) { /* sessionStorage unavailable */ }
  }

  function getStoredUtm(key) {
    try { return sessionStorage.getItem("ag_" + key) || ""; }
    catch (e) { return ""; }
  }

  function injectUtmFields(form) {
    UTM_KEYS.forEach(function (key) {
      var val = getStoredUtm(key);
      if (val) {
        var input = form.querySelector("[name='properties[" + key + "]']");
        if (!input) {
          input = document.createElement("input");
          input.type = "hidden";
          input.name = "properties[" + key + "]";
          form.appendChild(input);
        }
        input.value = val;
      }
    });
    /* Landing page */
    var landing = getStoredUtm("utm_landing");
    if (landing) {
      var lp = form.querySelector("[name='properties[Landing Page]']");
      if (!lp) {
        lp = document.createElement("input");
        lp.type = "hidden";
        lp.name = "properties[Landing Page]";
        form.appendChild(lp);
      }
      lp.value = landing;
    }
  }

  /* ── Indian PIN → City/State lookup (top metros) ──────── */
  var PIN_CITY_MAP = {
    "110": { city: "New Delhi", state: "Delhi" },
    "400": { city: "Mumbai", state: "Maharashtra" },
    "560": { city: "Bengaluru", state: "Karnataka" },
    "600": { city: "Chennai", state: "Tamil Nadu" },
    "500": { city: "Hyderabad", state: "Telangana" },
    "700": { city: "Kolkata", state: "West Bengal" },
    "380": { city: "Ahmedabad", state: "Gujarat" },
    "411": { city: "Pune", state: "Maharashtra" },
    "302": { city: "Jaipur", state: "Rajasthan" },
    "226": { city: "Lucknow", state: "Uttar Pradesh" },
    "462": { city: "Bhopal", state: "Madhya Pradesh" },
    "682": { city: "Kochi", state: "Kerala" },
    "360": { city: "Rajkot", state: "Gujarat" },
    "388": { city: "Anand", state: "Gujarat" },
    "395": { city: "Surat", state: "Gujarat" },
    "390": { city: "Vadodara", state: "Gujarat" },
    "201": { city: "Noida", state: "Uttar Pradesh" },
    "122": { city: "Gurugram", state: "Haryana" },
    "141": { city: "Ludhiana", state: "Punjab" },
    "160": { city: "Chandigarh", state: "Chandigarh" },
    "440": { city: "Nagpur", state: "Maharashtra" },
    "452": { city: "Indore", state: "Madhya Pradesh" },
    "800": { city: "Patna", state: "Bihar" }
  };

  function lookupPinCity(pin) {
    if (!pin || pin.length < 3) return null;
    return PIN_CITY_MAP[pin.substring(0, 3)] || null;
  }

  /* ── Form validation helpers ──────────────────────────── */
  function validatePhone(value) {
    var digits = sanitizeDigits(value);
    if (digits.length !== 10) return "Phone number must be 10 digits.";
    if (digits[0] < "6") return "Phone number must start with 6, 7, 8, or 9.";
    return "";
  }

  function validatePin(value) {
    var digits = sanitizeDigits(value);
    if (digits.length !== 6) return "PIN code must be 6 digits.";
    if (digits[0] === "0") return "PIN code cannot start with 0.";
    return "";
  }

  function validateName(value) {
    var trimmed = (value || "").trim();
    if (trimmed.length < 2) return "Name must be at least 2 characters.";
    return "";
  }

  function validateAddress(value) {
    var trimmed = (value || "").trim();
    if (trimmed.length < 5) return "Please enter a valid address.";
    return "";
  }

  function showFieldError(input, message) {
    clearFieldError(input);
    if (!message) return;
    input.classList.add("ag-field--error");
    var errorEl = document.createElement("span");
    errorEl.className = "ag-field-error";
    errorEl.textContent = message;
    input.parentNode.appendChild(errorEl);
  }

  function clearFieldError(input) {
    input.classList.remove("ag-field--error");
    var parent = input.parentNode;
    var existing = parent.querySelector(".ag-field-error");
    if (existing) existing.remove();
  }

  document.addEventListener("DOMContentLoaded", function () {
    captureUtmParams();
    initRevealEffects(document);

    document
      .querySelectorAll("[data-ag-marketplace]")
      .forEach(function (marketplaceRoot) {
        initMarketplace(marketplaceRoot);
      });

    document
      .querySelectorAll("[data-ag-order-flow]")
      .forEach(function (orderRoot) {
        initOrderFlow(orderRoot);
      });
  });

  function initMarketplace(root) {
    var cards = Array.prototype.slice.call(root.querySelectorAll("[data-ag-card]"));

    /* Remove skeleton placeholders once real cards exist */
    var skeletons = root.querySelectorAll(".ag-skeleton-placeholder");
    skeletons.forEach(function (s) { s.remove(); });

    if (!cards.length) {
      return;
    }

    var locationSelect = root.querySelector("[data-ag-location-filter]");
    var searchInput = root.querySelector("[data-ag-search]");
    var toggleFiltersButton = root.querySelector("[data-ag-toggle-filters]");
    var filterPanel = root.querySelector("[data-ag-filter-panel]");
    var typeFiltersContainer = root.querySelector("[data-ag-type-filters]");
    var visibleCountLabel = root.querySelector("[data-ag-visible-count]");
    var listingContainer = root.querySelector("[data-ag-listings]");
    var allTypesLabel = root.dataset.allTypesLabel || "All types";
    var noResultsLabel = root.dataset.noResultsLabel || "No listings match your filters.";

    /* Enhanced empty state with SVG illustration and reset button */
    var emptyState = document.createElement("div");
    emptyState.className = "ag-empty-state ag-empty-state--dynamic";
    emptyState.innerHTML =
      '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">' +
        '<circle cx="32" cy="32" r="30" stroke="#d5cda9" stroke-width="2" fill="#faf8f1"/>' +
        '<path d="M22 26a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H24a2 2 0 0 1-2-2V26z" stroke="#8b8578" stroke-width="1.5"/>' +
        '<path d="M28 30l4 4 4-4" stroke="#8b8578" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' +
      '</svg>' +
      '<p>' + noResultsLabel + '</p>' +
      '<button type="button" class="ag-empty-reset-btn">Reset filters</button>';

    emptyState.querySelector(".ag-empty-reset-btn").addEventListener("click", function () {
      if (locationSelect) locationSelect.value = "all";
      if (searchInput) searchInput.value = "";
      activeType = "all";
      var chips = typeFiltersContainer ? typeFiltersContainer.querySelectorAll(".ag-filter-chip") : [];
      Array.prototype.forEach.call(chips, function (c, i) {
        c.classList.toggle("is-active", i === 0);
      });
      applyFilters();
    });

    var locationMap = new Map();
    var typeMap = new Map();

    cards.forEach(function (card) {
      var locationValue = card.dataset.location;
      var locationLabel = card.dataset.locationLabel;
      var typeValue = card.dataset.type;
      var typeLabel = card.dataset.typeLabel;

      if (locationValue && locationLabel && !locationMap.has(locationValue)) {
        locationMap.set(locationValue, locationLabel);
      }

      if (typeValue && typeLabel && !typeMap.has(typeValue)) {
        typeMap.set(typeValue, typeLabel);
      }
    });

    if (locationSelect) {
      locationMap.forEach(function (label, value) {
        var option = document.createElement("option");
        option.value = value;
        option.textContent = label;
        locationSelect.appendChild(option);
      });
    }

    var activeType = "all";

    if (typeFiltersContainer) {
      typeFiltersContainer.appendChild(
        createTypeChip({
          value: "all",
          label: allTypesLabel,
          active: true,
          onClick: function (value) {
            activeType = value;
            applyFilters();
          }
        })
      );

      typeMap.forEach(function (label, value) {
        typeFiltersContainer.appendChild(
          createTypeChip({
            value: value,
            label: label,
            active: false,
            onClick: function (nextValue) {
              activeType = nextValue;
              applyFilters();
            }
          })
        );
      });
    }

    if (toggleFiltersButton && filterPanel) {
      toggleFiltersButton.addEventListener("click", function () {
        var nextHidden = !filterPanel.hasAttribute("hidden");

        if (nextHidden) {
          filterPanel.setAttribute("hidden", "hidden");
          toggleFiltersButton.setAttribute("aria-expanded", "false");
          return;
        }

        filterPanel.removeAttribute("hidden");
        toggleFiltersButton.setAttribute("aria-expanded", "true");
      });
    }

    if (locationSelect) {
      locationSelect.addEventListener("change", applyFilters);
    }

    if (searchInput) {
      searchInput.addEventListener("input", debounce(applyFilters, 250));
    }

    function applyFilters() {
      var activeLocation = locationSelect ? locationSelect.value : "all";
      var query = searchInput ? searchInput.value.trim().toLowerCase() : "";
      var visibleCount = 0;

      cards.forEach(function (card) {
        var matchesLocation =
          activeLocation === "all" || card.dataset.location === activeLocation;
        var matchesType = activeType === "all" || card.dataset.type === activeType;
        var searchable = (card.dataset.search || "").toLowerCase();
        var matchesSearch = !query || searchable.indexOf(query) !== -1;
        var shouldShow = matchesLocation && matchesType && matchesSearch;

        if (shouldShow) {
          card.style.display = "";
          visibleCount += 1;
        } else {
          card.style.display = "none";
        }
      });

      if (visibleCountLabel) {
        visibleCountLabel.textContent = String(visibleCount);
      }

      if (!listingContainer) {
        return;
      }

      if (visibleCount === 0) {
        if (!listingContainer.contains(emptyState)) {
          listingContainer.appendChild(emptyState);
        }
      } else if (listingContainer.contains(emptyState)) {
        listingContainer.removeChild(emptyState);
      }
    }

    applyFilters();
  }

  function createTypeChip(options) {
    var chip = document.createElement("button");
    chip.type = "button";
    chip.className = "ag-filter-chip" + (options.active ? " is-active" : "");
    chip.dataset.value = options.value;
    chip.textContent = options.label;

    chip.addEventListener("click", function () {
      var siblings = chip.parentElement
        ? chip.parentElement.querySelectorAll(".ag-filter-chip")
        : [];

      Array.prototype.forEach.call(siblings, function (sibling) {
        sibling.classList.remove("is-active");
      });

      chip.classList.add("is-active");
      options.onClick(options.value);
    });

    return chip;
  }

  function initOrderFlow(root) {
    var form = root.querySelector("[data-ag-order-form]");
    if (!form) {
      return;
    }

    var minusButton = root.querySelector("[data-ag-minus]");
    var plusButton = root.querySelector("[data-ag-plus]");
    var quantityDisplay = root.querySelector("[data-ag-quantity-display]");
    var quantityInput = root.querySelector("[data-ag-quantity-input]");
    var summaryQuantity = root.querySelector("[data-ag-summary-qty]");
    var summaryTotal = root.querySelector("[data-ag-summary-total]");
    var summaryPriceEls = root.querySelectorAll("[data-ag-summary-price]");
    var summaryCommission = root.querySelector("[data-ag-summary-commission]");
    var summaryNetPayable = root.querySelector("[data-ag-summary-net-payable]");
    var summaryCommissionRate = root.querySelector("[data-ag-commission-rate-label]");
    var unitLabelEls = root.querySelectorAll("[data-ag-unit-label]");
    var maxStockEl = root.querySelector("[data-ag-max-stock]");
    var verifyNote = root.querySelector("[data-ag-verify-note]");
    var phoneInput = root.querySelector("[data-ag-phone-input]");
    var pinInput = root.querySelector("[data-ag-pin-input]");
    var etaNote = root.querySelector("[data-ag-eta-note]");
    var etaNoteInline = root.querySelector("[data-ag-eta-note-inline]");
    var submitButton = root.querySelector("[data-ag-submit-btn]");
    var variantIdInput = root.querySelector("[data-ag-variant-id]");
    var orderTotalPropertyInput = root.querySelector("[data-ag-order-total-property]");
    var commissionPropertyInput = root.querySelector("[data-ag-commission-property]");
    var netPayablePropertyInput = root.querySelector("[data-ag-net-payable-property]");
    var commissionRatePropertyInput = root.querySelector(
      "[data-ag-commission-rate-property]"
    );
    var etaPropertyInput = root.querySelector("[data-ag-eta-property]");
    var variantsJsonNode = root.querySelector("[data-ag-variants-json]");

    /* Sticky summary bar elements */
    var stickyBar = document.querySelector("[data-ag-sticky-summary]");
    var stickyTotal = document.querySelector("[data-ag-sticky-total]");
    var stickyQty = document.querySelector("[data-ag-sticky-qty]");
    var stickyCommission = document.querySelector("[data-ag-sticky-commission]");
    var stickyPayBtn = document.querySelector("[data-ag-sticky-pay-btn]");

    var labels = {
      stockFlexible: root.dataset.stockFlexibleLabel || "25+",
      verifyNotRequired:
        root.dataset.verifyNoteNotRequired ||
        "Phone verification is disabled. You can place order directly.",
      stockExceeded:
        root.dataset.verifyNoteStockExceeded ||
        "Quantity exceeds available stock.",
      orderFailed:
        root.dataset.verifyNoteOrderFailed ||
        "Could not place the order. Please try again.",
      stockRefreshFailed:
        root.dataset.verifyNoteStockRefreshFailed ||
        "Could not refresh live stock. Proceeding with current stock value.",
      soldOutNote:
        root.dataset.verifyNoteSoldOut ||
        "This listing is currently out of stock.",
      submitReady: root.dataset.submitReadyLabel || "Place Order & Pay",
      submitLoading: root.dataset.submitLoadingLabel || "Adding to cart...",
      submitSoldOut: root.dataset.submitSoldOutLabel || "Sold Out",
      unit: root.dataset.unitLabel || "kg",
      etaEnterPin:
        root.dataset.etaEnterPinLabel || "Enter your PIN to see estimated delivery window.",
      etaMetro: root.dataset.etaMetroLabel || "Estimated delivery: 2-3 business days.",
      etaRegular: root.dataset.etaRegularLabel || "Estimated delivery: 4-6 business days.",
      etaUnserviceable:
        root.dataset.etaUnserviceableLabel ||
        "This PIN may not be serviceable. Our team will confirm after checkout.",
      codAvailable:
        root.dataset.codAvailableLabel ||
        "Cash on delivery is available for this PIN code.",
      codUnavailable:
        root.dataset.codUnavailableLabel ||
        "Cash on delivery is not available for this PIN code. Prepaid only."
    };
    var metroPinPrefixes = parsePrefixes(root.dataset.metroPinPrefixes);
    var unserviceablePinPrefixes = parsePrefixes(root.dataset.unserviceablePinPrefixes);
    var codBlockedPrefixes = parsePrefixes(root.dataset.codBlockedPinPrefixes);

    /* COD eligibility note element */
    var codNote = root.querySelector("[data-ag-cod-note]");

    var commissionRatePercent = Number(root.dataset.commissionRate || 10);
    if (isNaN(commissionRatePercent) || commissionRatePercent < 0) {
      commissionRatePercent = 10;
    }
    commissionRatePercent = Math.min(commissionRatePercent, 100);
    var commissionRate = commissionRatePercent / 100;

    var variants = [];
    try {
      variants = JSON.parse(variantsJsonNode ? variantsJsonNode.textContent : "[]") || [];
    } catch (error) {
      variants = [];
    }

    var selectedVariant = pickVariant(variants);
    var unitPriceCents = selectedVariant
      ? Number(selectedVariant.price || 0)
      : Number(root.dataset.unitPrice || 0);
    var trackedStock = selectedVariant ? selectedVariant.inventory_management : null;
    var isStockTracked = Boolean(trackedStock);
    var maxStock = selectedVariant
      ? Number(selectedVariant.inventory_quantity || 0)
      : Number(root.dataset.maxStock || 0);

    if (!isStockTracked) {
      maxStock = 25;
    }

    if (maxStock < 1) {
      maxStock = isStockTracked ? 0 : 25;
    }

    var quantity = maxStock > 0 ? 1 : 0;
    var isSubmitting = false;

    var defaultSubmitText = submitButton
      ? submitButton.textContent.trim()
      : "Verify Phone to Continue";

    if (selectedVariant && variantIdInput) {
      variantIdInput.value = String(selectedVariant.id);
    }

    function setVerifyMessage(message, status) {
      if (!verifyNote) {
        return;
      }

      verifyNote.textContent = message;
      verifyNote.classList.remove("is-error", "is-verified");

      if (status === "error") {
        verifyNote.classList.add("is-error");
      } else if (status === "verified") {
        verifyNote.classList.add("is-verified");
      }
    }

    function updateSubmitState() {
      if (!submitButton) {
        return;
      }

      if (isSubmitting) {
        submitButton.disabled = true;
        submitButton.textContent = labels.submitLoading;
        return;
      }

      if (maxStock < 1) {
        submitButton.disabled = true;
        submitButton.textContent = labels.submitSoldOut;
        return;
      }

      var canSubmit = quantity > 0;
      submitButton.disabled = !canSubmit;
      submitButton.textContent = canSubmit ? labels.submitReady : defaultSubmitText;
    }

    function updateSummary() {
      if (quantityDisplay) {
        quantityDisplay.textContent = String(quantity);
      }

      if (quantityInput) {
        quantityInput.value = String(quantity);
      }

      if (summaryQuantity) {
        summaryQuantity.textContent = String(quantity);
      }

      Array.prototype.forEach.call(unitLabelEls, function (unitEl) {
        unitEl.textContent = labels.unit;
      });

      if (maxStockEl) {
        maxStockEl.textContent = isStockTracked ? String(maxStock) : labels.stockFlexible;
      }

      var totalCents = unitPriceCents * quantity;
      var commissionCents = Math.round(totalCents * commissionRate);
      var netPayableCents = Math.max(totalCents - commissionCents, 0);
      var formattedPrice = formatMoney(unitPriceCents);
      var formattedTotal = formatMoney(totalCents);
      var formattedCommission = formatMoney(commissionCents);
      var formattedNetPayable = formatMoney(netPayableCents);

      Array.prototype.forEach.call(summaryPriceEls, function (priceEl) {
        priceEl.textContent = formattedPrice;
      });

      if (summaryTotal) {
        summaryTotal.textContent = formattedTotal;
      }

      if (summaryCommission) {
        summaryCommission.textContent = formattedCommission;
      }

      if (summaryNetPayable) {
        summaryNetPayable.textContent = formattedNetPayable;
      }

      if (summaryCommissionRate) {
        summaryCommissionRate.textContent = "(" + formatPercent(commissionRatePercent) + "%)";
      }

      if (orderTotalPropertyInput) {
        orderTotalPropertyInput.value = formattedTotal;
      }

      if (commissionPropertyInput) {
        commissionPropertyInput.value = formattedCommission;
      }

      if (netPayablePropertyInput) {
        netPayablePropertyInput.value = formattedNetPayable;
      }

      if (commissionRatePropertyInput) {
        commissionRatePropertyInput.value = formatPercent(commissionRatePercent) + "%";
      }

      if (plusButton) {
        plusButton.disabled = quantity >= maxStock;
      }

      if (minusButton) {
        minusButton.disabled = quantity <= 1;
      }

      /* Update sticky summary bar */
      if (stickyTotal) stickyTotal.textContent = formattedTotal;
      if (stickyQty) stickyQty.textContent = String(quantity);
      if (stickyCommission) stickyCommission.textContent = formattedCommission;
      if (stickyPayBtn) {
        stickyPayBtn.disabled = submitButton ? submitButton.disabled : true;
        stickyPayBtn.textContent = submitButton ? submitButton.textContent : labels.submitReady;
      }

      updateSubmitState();
    }

    function setEtaText(message) {
      if (etaNote) {
        etaNote.textContent = message;
      }
      if (etaNoteInline) {
        etaNoteInline.textContent = message;
      }
      if (etaPropertyInput) {
        etaPropertyInput.value = message;
      }
    }

    function getEtaText(pin) {
      if (pin.length !== 6) {
        return labels.etaEnterPin;
      }

      if (matchesPrefix(pin, unserviceablePinPrefixes)) {
        return labels.etaUnserviceable;
      }

      if (matchesPrefix(pin, metroPinPrefixes)) {
        return labels.etaMetro;
      }

      return labels.etaRegular;
    }

    function resetVerification() {
      setVerifyMessage(labels.verifyNotRequired);
      updateSubmitState();
    }

    function refreshTrackedStock() {
      if (!isStockTracked || !selectedVariant || !root.dataset.productHandle) {
        return Promise.resolve();
      }

      var url = "/products/" + encodeURIComponent(root.dataset.productHandle) + ".js";
      return fetch(url, {
        headers: {
          Accept: "application/json"
        }
      })
        .then(parseJsonResponse)
        .then(function (productPayload) {
          var variantsList = (productPayload && productPayload.variants) || [];
          var latestVariant = variantsList.find(function (variant) {
            return String(variant.id) === String(selectedVariant.id);
          });

          if (!latestVariant) {
            return;
          }

          maxStock = Math.max(Number(latestVariant.inventory_quantity || 0), 0);
          if (quantity > maxStock) {
            quantity = maxStock;
          }

          updateSummary();
        })
        .catch(function () {
          setVerifyMessage(labels.stockRefreshFailed, "error");
        });
    }

    if (plusButton) {
      plusButton.addEventListener("click", function () {
        if (quantity >= maxStock) {
          return;
        }

        quantity += 1;
        updateSummary();
      });
    }

    if (minusButton) {
      minusButton.addEventListener("click", function () {
        if (quantity <= 1) {
          return;
        }

        quantity -= 1;
        updateSummary();
      });
    }

    if (phoneInput) {
      phoneInput.addEventListener("input", function () {
        var sanitized = sanitizeDigits(phoneInput.value).slice(0, 10);
        phoneInput.value = sanitized;
      });
    }

    if (pinInput) {
      pinInput.addEventListener("input", function () {
        var sanitizedPin = sanitizeDigits(pinInput.value).slice(0, 6);
        pinInput.value = sanitizedPin;
        setEtaText(getEtaText(sanitizedPin));

        /* Auto-fill city/state from PIN prefix */
        var cityLookup = lookupPinCity(sanitizedPin);
        if (cityLookup) {
          var cityField = form.querySelector("[name='properties[City]']");
          var stateField = form.querySelector("[name='properties[State]']");
          if (cityField && !cityField.value) cityField.value = cityLookup.city;
          if (stateField && !stateField.value) stateField.value = cityLookup.state;
        }

        /* COD eligibility check */
        if (codNote && sanitizedPin.length === 6) {
          var codBlocked = matchesPrefix(sanitizedPin, codBlockedPrefixes) ||
                           matchesPrefix(sanitizedPin, unserviceablePinPrefixes);
          if (codBlocked) {
            codNote.textContent = labels.codUnavailable;
            codNote.classList.add("is-cod-blocked");
            codNote.classList.remove("is-cod-available");
          } else {
            codNote.textContent = labels.codAvailable;
            codNote.classList.add("is-cod-available");
            codNote.classList.remove("is-cod-blocked");
          }
        } else if (codNote) {
          codNote.textContent = "";
          codNote.classList.remove("is-cod-available", "is-cod-blocked");
        }
      });
    }

    /* ── Inline validation on name and address blur ────── */
    var nameInput = form.querySelector("[name='properties[Customer Name]']");
    var addr1Input = form.querySelector("[name='properties[Address Line 1]']");

    if (nameInput) {
      nameInput.addEventListener("blur", function () {
        var err = validateName(nameInput.value);
        if (err) showFieldError(nameInput, err);
        else clearFieldError(nameInput);
      });
    }

    if (addr1Input) {
      addr1Input.addEventListener("blur", function () {
        var err = validateAddress(addr1Input.value);
        if (err) showFieldError(addr1Input, err);
        else clearFieldError(addr1Input);
      });
    }

    /* Inject UTM fields before validation */
    injectUtmFields(form);

    /* PII hidden field references */
    var piiPhoneField = form.querySelector("[data-ag-phone-property]");
    var piiAddressField = form.querySelector("[data-ag-address-property]");
    var piiPinField = form.querySelector("[data-ag-pin-property]");

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      if (isSubmitting) {
        return;
      }

      /* ── Copy PII to hidden underscore-prefixed fields ── */
      if (piiPhoneField && phoneInput) piiPhoneField.value = phoneInput.value;
      if (piiPinField && pinInput) piiPinField.value = pinInput.value;
      if (piiAddressField) {
        var addr1 = form.querySelector("[name='properties[Address Line 1]']");
        var addr2 = form.querySelector("[name='properties[Address Line 2]']");
        var cityField = form.querySelector("[name='properties[City]']");
        var stateField = form.querySelector("[name='properties[State]']");
        var parts = [];
        if (addr1 && addr1.value) parts.push(addr1.value.trim());
        if (addr2 && addr2.value) parts.push(addr2.value.trim());
        if (cityField && cityField.value) parts.push(cityField.value.trim());
        if (stateField && stateField.value) parts.push(stateField.value.trim());
        piiAddressField.value = parts.join(", ");
      }

      /* ── Client-side validation ─────────────────────── */
      var validationErrors = [];

      if (nameInput) {
        var nameErr = validateName(nameInput.value);
        if (nameErr) { showFieldError(nameInput, nameErr); validationErrors.push(nameErr); }
        else clearFieldError(nameInput);
      }

      if (phoneInput) {
        var phoneErr = validatePhone(phoneInput.value);
        if (phoneErr) { showFieldError(phoneInput, phoneErr); validationErrors.push(phoneErr); }
        else clearFieldError(phoneInput);
      }

      if (addr1Input) {
        var addrErr = validateAddress(addr1Input.value);
        if (addrErr) { showFieldError(addr1Input, addrErr); validationErrors.push(addrErr); }
        else clearFieldError(addr1Input);
      }

      if (pinInput) {
        var pinErr = validatePin(pinInput.value);
        if (pinErr) { showFieldError(pinInput, pinErr); validationErrors.push(pinErr); }
        else clearFieldError(pinInput);
      }

      if (validationErrors.length > 0) {
        showToast(validationErrors[0], "error");
        /* Scroll to first error field */
        var firstError = form.querySelector(".ag-field--error");
        if (firstError) firstError.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }

      if (quantity < 1 || quantity > maxStock) {
        setVerifyMessage(labels.stockExceeded, "error");
        showToast(labels.stockExceeded, "error");
        return;
      }

      isSubmitting = true;
      updateSubmitState();
      showOverlay(true);

      refreshTrackedStock()
        .then(function () {
          if (quantity < 1 || quantity > maxStock) {
            var stockError = new Error(labels.stockExceeded);
            stockError.code = "stock";
            throw stockError;
          }

          var formData = new FormData(form);

          /* ── Build structured order note for dispatch ─── */
          var noteLines = [];
          noteLines.push("--- Animall Gopi Order ---");
          noteLines.push("Farmer: " + (root.querySelector("[name='properties[Farmer Name]']") || {}).value);
          noteLines.push("Location: " + (root.querySelector("[name='properties[Farmer Location]']") || {}).value);
          noteLines.push("Type: " + (root.querySelector("[name='properties[Ghee Type]']") || {}).value);
          noteLines.push("Qty: " + quantity + " " + labels.unit);
          noteLines.push("Commission: " + (commissionPropertyInput ? commissionPropertyInput.value : ""));
          noteLines.push("Phone: " + (phoneInput ? phoneInput.value : ""));
          noteLines.push("PIN: " + (pinInput ? pinInput.value : ""));
          var cityInput = form.querySelector("[name='properties[City]']");
          if (cityInput && cityInput.value) noteLines.push("City: " + cityInput.value);
          noteLines.push("ETA: " + (etaPropertyInput ? etaPropertyInput.value : ""));
          noteLines.push("---");

          /* Append note to cart via separate AJAX call */
          fetch("/cart/update.js", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Accept": "application/json" },
            body: JSON.stringify({ note: noteLines.join("\n") })
          }).catch(function () { /* non-critical */ });

          return fetch("/cart/add.js", {
            method: "POST",
            body: formData,
            headers: {
              Accept: "application/json"
            }
          }).then(parseJsonResponse);
        })
        .then(function () {
          /* GA4: add_to_cart event */
          trackEvent("add_to_cart", {
            currency: "INR",
            value: (unitPriceCents * quantity) / 100,
            items: [{
              item_id: selectedVariant ? String(selectedVariant.id) : "",
              item_name: root.dataset.productHandle || "",
              quantity: quantity,
              price: unitPriceCents / 100
            }]
          });

          showToast("Added to cart! Redirecting to checkout...", "success");
          setTimeout(function () {
            window.location.href = "/checkout";
          }, 600);
        })
        .catch(function (error) {
          showOverlay(false);
          if (error && error.code === "stock") {
            setVerifyMessage(labels.stockExceeded, "error");
            showToast(labels.stockExceeded, "error");
          } else {
            /* ── Friendly error copy by failure type ─────── */
            var rawMsg = (error && error.message) || "";
            var payload = (error && error.payload) || {};
            var msg = labels.orderFailed;

            if (rawMsg.indexOf("422") !== -1 || payload.status === 422) {
              msg = "This product is currently unavailable. Please refresh and try again.";
            } else if (rawMsg.indexOf("429") !== -1 || payload.status === 429) {
              msg = "Too many requests. Please wait a moment and try again.";
            } else if (rawMsg.indexOf("network") !== -1 || rawMsg.indexOf("Failed to fetch") !== -1) {
              msg = "Network error. Please check your connection and try again.";
            } else if (rawMsg.indexOf("timeout") !== -1) {
              msg = "Request timed out. Please try again.";
            } else if (rawMsg) {
              msg = rawMsg;
            }

            setVerifyMessage(msg, "error");
            showToast(msg, "error");

            /* GA4: track cart failure for funnel debugging */
            trackEvent("cart_error", {
              error_message: msg,
              product_handle: root.dataset.productHandle || "",
              quantity: quantity
            });
          }

          isSubmitting = false;
          updateSubmitState();
        });
    });

    /* ── Loading overlay helpers ──────────────────────── */
    function showOverlay(visible) {
      var overlay = root.querySelector(".ag-loading-overlay");
      if (!overlay) {
        overlay = document.createElement("div");
        overlay.className = "ag-loading-overlay";
        overlay.innerHTML = '<div class="ag-loading-spinner"></div><p>Adding to cart...</p>';
        root.appendChild(overlay);
      }
      if (visible) {
        overlay.classList.add("is-visible");
      } else {
        overlay.classList.remove("is-visible");
      }
    }

    /* ── Direct quantity input (tap to type) ────────── */
    if (quantityDisplay) {
      quantityDisplay.style.cursor = "pointer";
      quantityDisplay.setAttribute("tabindex", "0");
      quantityDisplay.setAttribute("role", "spinbutton");
      quantityDisplay.setAttribute("aria-valuemin", "1");
      quantityDisplay.setAttribute("aria-valuemax", String(maxStock));
      quantityDisplay.setAttribute("aria-valuenow", String(quantity));

      quantityDisplay.addEventListener("click", function () {
        var input = document.createElement("input");
        input.type = "number";
        input.className = "ag-qty-direct-input";
        input.min = "1";
        input.max = String(maxStock);
        input.value = String(quantity);
        input.inputMode = "numeric";
        quantityDisplay.textContent = "";
        quantityDisplay.appendChild(input);
        input.focus();
        input.select();

        function commitValue() {
          var newQty = parseInt(input.value, 10);
          if (isNaN(newQty) || newQty < 1) newQty = 1;
          if (newQty > maxStock) newQty = maxStock;
          quantity = newQty;
          quantityDisplay.textContent = String(quantity);
          quantityDisplay.setAttribute("aria-valuenow", String(quantity));
          updateSummary();
        }

        input.addEventListener("blur", commitValue);
        input.addEventListener("keydown", function (e) {
          if (e.key === "Enter") { e.preventDefault(); input.blur(); }
        });
      });
    }

    /* ── GA4: view_item event ─────────────────────────── */
    trackEvent("view_item", {
      currency: "INR",
      value: unitPriceCents / 100,
      items: [{
        item_id: selectedVariant ? String(selectedVariant.id) : "",
        item_name: root.dataset.productHandle || "",
        price: unitPriceCents / 100
      }]
    });

    resetVerification();
    updateSummary();
    setEtaText(labels.etaEnterPin);

    if (maxStock === 0) {
      setVerifyMessage(labels.soldOutNote, "error");
      updateSubmitState();
    }

    /* ── Sticky summary: show when main submit scrolls out of view ── */
    if (stickyBar && submitButton) {
      if ("IntersectionObserver" in window) {
        var stickyObserver = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              stickyBar.classList.remove("is-visible");
            } else {
              stickyBar.classList.add("is-visible");
            }
          });
        }, { threshold: 0.1 });
        stickyObserver.observe(submitButton);
      }

      if (stickyPayBtn) {
        stickyPayBtn.addEventListener("click", function () {
          if (!submitButton.disabled) {
            form.requestSubmit ? form.requestSubmit() : submitButton.click();
          }
        });
      }
    }
  }

  function parsePrefixes(rawValue) {
    return String(rawValue || "")
      .split(",")
      .map(function (prefix) {
        return sanitizeDigits(prefix.trim());
      })
      .filter(function (prefix) {
        return prefix.length > 0;
      });
  }

  function matchesPrefix(pin, prefixes) {
    if (!prefixes || !prefixes.length) {
      return false;
    }

    return prefixes.some(function (prefix) {
      return pin.indexOf(prefix) === 0;
    });
  }

  function pickVariant(variants) {
    if (!variants.length) {
      return null;
    }

    var params = new URLSearchParams(window.location.search);
    var variantFromQuery = params.get("variant");

    if (variantFromQuery) {
      var match = variants.find(function (variant) {
        return String(variant.id) === variantFromQuery;
      });

      if (match) {
        return match;
      }
    }

    var availableVariant = variants.find(function (variant) {
      return variant.available;
    });

    return availableVariant || variants[0];
  }

  function parseJsonResponse(response) {
    return response.text().then(function (bodyText) {
      var payload = {};
      if (bodyText) {
        try {
          payload = JSON.parse(bodyText);
        } catch (error) {
          payload = {};
        }
      }

      if (!response.ok) {
        var requestError = new Error(payload.message || "Request failed");
        requestError.payload = payload;
        throw requestError;
      }

      return payload;
    });
  }

  function sanitizeDigits(value) {
    return String(value || "").replace(/\D/g, "");
  }

  function toPositiveInt(value, fallback) {
    var parsed = Number(value);
    if (isNaN(parsed) || parsed < 1) {
      return fallback;
    }
    return Math.round(parsed);
  }

  function formatPercent(value) {
    var rounded = Math.round(Number(value) * 100) / 100;
    if (Math.round(rounded) === rounded) {
      return String(Math.round(rounded));
    }
    return rounded.toFixed(2).replace(/\.?0+$/, "");
  }

  function formatMoney(cents) {
    if (window.Shopify && typeof window.Shopify.formatMoney === "function") {
      return window.Shopify.formatMoney(cents).replace(".00", "");
    }

    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format((cents || 0) / 100);
  }

  function initRevealEffects(scope) {
    var revealNodes = scope.querySelectorAll(".ag-reveal");
    if (!revealNodes.length) {
      return;
    }

    if (!("IntersectionObserver" in window)) {
      revealNodes.forEach(function (node) {
        node.classList.add("is-visible");
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) {
            return;
          }

          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      {
        rootMargin: "0px 0px -40px 0px",
        threshold: 0.1
      }
    );

    revealNodes.forEach(function (node, index) {
      node.style.transitionDelay = Math.min(index * 45, 300) + "ms";
      observer.observe(node);
    });
  }
})();
