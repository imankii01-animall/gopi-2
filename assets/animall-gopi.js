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
    var unitLabelEls = root.querySelectorAll("[data-ag-unit-label]");
    var maxStockEl = root.querySelector("[data-ag-max-stock]");
    var verifyButton = root.querySelector("[data-ag-verify-btn]");
    var verifyNote = root.querySelector("[data-ag-verify-note]");
    var phoneInput = root.querySelector("[data-ag-phone-input]");
    var phoneVerifiedInput = root.querySelector("[data-ag-phone-verified-field]");
    var submitButton = root.querySelector("[data-ag-submit-btn]");
    var variantIdInput = root.querySelector("[data-ag-variant-id]");
    var variantsJsonNode = root.querySelector("[data-ag-variants-json]");
    var labels = {
      stockFlexible: root.dataset.stockFlexibleLabel || "25+",
      verifyDefault:
        root.dataset.verifyNoteDefault || "Verify your phone number to continue.",
      verifyInvalidPhone:
        root.dataset.verifyNoteInvalidPhone ||
        "Enter a valid 10-digit phone number.",
      verifySuccess:
        root.dataset.verifyNoteVerified ||
        "Phone verified. You can place your order now.",
      verifyRequired:
        root.dataset.verifyNoteRequireVerify ||
        "Please verify your phone number before placing the order.",
      stockExceeded:
        root.dataset.verifyNoteStockExceeded ||
        "Quantity exceeds available stock.",
      orderFailed:
        root.dataset.verifyNoteOrderFailed ||
        "Could not place the order. Please try again.",
      soldOutNote:
        root.dataset.verifyNoteSoldOut ||
        "This listing is currently out of stock.",
      verifyButton: root.dataset.verifyButtonLabel || "Verify",
      verifiedButton: root.dataset.verifiedButtonLabel || "Verified",
      submitReady: root.dataset.submitReadyLabel || "Place Order & Pay",
      submitLoading: root.dataset.submitLoadingLabel || "Adding to cart...",
      submitSoldOut: root.dataset.submitSoldOutLabel || "Sold Out",
      unit: root.dataset.unitLabel || "kg"
    };

    var variants = [];
    try {
      variants = JSON.parse(variantsJsonNode ? variantsJsonNode.textContent : "[]") || [];
    } catch (error) {
      variants = [];
    }

    var selectedVariant = pickVariant(variants);
    var unitPriceCents = selectedVariant ? Number(selectedVariant.price || 0) : Number(root.dataset.unitPrice || 0);
    var trackedStock = selectedVariant ? selectedVariant.inventory_management : null;
    var isStockTracked = Boolean(trackedStock);
    var maxStock = selectedVariant ? Number(selectedVariant.inventory_quantity || 0) : Number(root.dataset.maxStock || 0);

    if (!isStockTracked) {
      maxStock = 25;
    }

    if (maxStock < 1) {
      maxStock = isStockTracked ? 0 : 25;
    }

    var quantity = maxStock > 0 ? 1 : 0;
    var phoneVerified = false;
    var defaultSubmitText = submitButton ? submitButton.textContent.trim() : "Verify Phone to Continue";
    var readySubmitText = labels.submitReady || "Place Order & Pay";

    if (verifyButton) {
      verifyButton.textContent = labels.verifyButton;
    }

    if (selectedVariant && variantIdInput) {
      variantIdInput.value = String(selectedVariant.id);
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

      var formattedPrice = formatMoney(unitPriceCents);
      var formattedTotal = formatMoney(unitPriceCents * quantity);

      Array.prototype.forEach.call(summaryPriceEls, function (priceEl) {
        priceEl.textContent = formattedPrice;
      });

      if (summaryTotal) {
        summaryTotal.textContent = formattedTotal;
      }

      if (plusButton) {
        plusButton.disabled = quantity >= maxStock;
      }

      if (minusButton) {
        minusButton.disabled = quantity <= 1;
      }

      updateSubmitState();
    }

    function updateSubmitState() {
      if (!submitButton) {
        return;
      }

      var hasStock = maxStock > 0;
      var canSubmit = hasStock && phoneVerified;

      submitButton.disabled = !canSubmit;
      submitButton.textContent = canSubmit ? readySubmitText : defaultSubmitText;
    }

    function resetVerification() {
      phoneVerified = false;
      if (phoneVerifiedInput) {
        phoneVerifiedInput.value = "No";
      }

      if (verifyNote) {
        verifyNote.textContent = labels.verifyDefault;
        verifyNote.classList.remove("is-verified", "is-error");
      }

      if (verifyButton) {
        verifyButton.textContent = labels.verifyButton;
      }

      updateSubmitState();
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
        phoneInput.value = phoneInput.value.replace(/\D/g, "").slice(0, 10);
        resetVerification();
      });
    }

    if (verifyButton) {
      verifyButton.addEventListener("click", function () {
        var phoneValue = phoneInput ? phoneInput.value.trim() : "";
        var validPhone = /^[0-9]{10}$/.test(phoneValue);

        if (!validPhone) {
          if (verifyNote) {
            verifyNote.textContent = labels.verifyInvalidPhone;
            verifyNote.classList.add("is-error");
            verifyNote.classList.remove("is-verified");
          }
          return;
        }

        phoneVerified = true;

        if (phoneVerifiedInput) {
          phoneVerifiedInput.value = "Yes";
        }

        if (verifyButton) {
          verifyButton.textContent = labels.verifiedButton;
        }

        if (verifyNote) {
          verifyNote.textContent = labels.verifySuccess;
          verifyNote.classList.remove("is-error");
          verifyNote.classList.add("is-verified");
        }

        updateSubmitState();
      });
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      if (!phoneVerified) {
        if (verifyNote) {
          verifyNote.textContent = labels.verifyRequired;
          verifyNote.classList.add("is-error");
          verifyNote.classList.remove("is-verified");
        }
        return;
      }

      if (quantity > maxStock) {
        if (verifyNote) {
          verifyNote.textContent = labels.stockExceeded;
          verifyNote.classList.add("is-error");
          verifyNote.classList.remove("is-verified");
        }
        return;
      }

      var formData = new FormData(form);

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = labels.submitLoading;
      }

      fetch("/cart/add.js", {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json"
        }
      })
        .then(function (response) {
          if (!response.ok) {
            throw new Error("Failed to add item to cart");
          }
          return response.json();
        })
        .then(function () {
          window.location.href = "/checkout";
        })
        .catch(function () {
          if (verifyNote) {
            verifyNote.textContent = labels.orderFailed;
            verifyNote.classList.add("is-error");
            verifyNote.classList.remove("is-verified");
          }

          updateSubmitState();
        });
    });

    if (maxStock === 0) {
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = labels.submitSoldOut;
      }

      if (verifyNote) {
        verifyNote.textContent = labels.soldOutNote;
        verifyNote.classList.add("is-error");
      }
    }

    updateSummary();
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
