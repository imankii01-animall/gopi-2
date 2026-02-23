(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
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
    var emptyState = document.createElement("p");
    emptyState.className = "ag-empty-state ag-empty-state--dynamic";
    emptyState.textContent = noResultsLabel;

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
      searchInput.addEventListener("input", applyFilters);
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
    var submitButton = root.querySelector("[data-ag-submit-btn]");
    var variantIdInput = root.querySelector("[data-ag-variant-id]");
    var orderTotalPropertyInput = root.querySelector("[data-ag-order-total-property]");
    var commissionPropertyInput = root.querySelector("[data-ag-commission-property]");
    var netPayablePropertyInput = root.querySelector("[data-ag-net-payable-property]");
    var commissionRatePropertyInput = root.querySelector(
      "[data-ag-commission-rate-property]"
    );
    var variantsJsonNode = root.querySelector("[data-ag-variants-json]");

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
      unit: root.dataset.unitLabel || "kg"
    };

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

      updateSubmitState();
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

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      if (isSubmitting) {
        return;
      }

      if (quantity < 1 || quantity > maxStock) {
        setVerifyMessage(labels.stockExceeded, "error");
        return;
      }

      isSubmitting = true;
      updateSubmitState();

      refreshTrackedStock()
        .then(function () {
          if (quantity < 1 || quantity > maxStock) {
            var stockError = new Error(labels.stockExceeded);
            stockError.code = "stock";
            throw stockError;
          }

          var formData = new FormData(form);
          return fetch("/cart/add.js", {
            method: "POST",
            body: formData,
            headers: {
              Accept: "application/json"
            }
          }).then(parseJsonResponse);
        })
        .then(function () {
          window.location.href = "/checkout";
        })
        .catch(function (error) {
          if (error && error.code === "stock") {
            setVerifyMessage(labels.stockExceeded, "error");
          } else {
            setVerifyMessage((error && error.message) || labels.orderFailed, "error");
          }

          isSubmitting = false;
          updateSubmitState();
        });
    });

    resetVerification();
    updateSummary();

    if (maxStock === 0) {
      setVerifyMessage(labels.soldOutNote, "error");
      updateSubmitState();
    }
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
