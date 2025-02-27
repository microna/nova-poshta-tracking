// Tab switching functionality
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    // Remove active class from all tabs
    document
      .querySelectorAll(".tab")
      .forEach((t) => t.classList.remove("active"));
    document
      .querySelectorAll(".tab-content")
      .forEach((t) => t.classList.remove("active"));

    // Add active class to clicked tab
    tab.classList.add("active");
    document.getElementById(tab.dataset.tab).classList.add("active");
  });
});

// Advanced options toggle
document.getElementById("show-advanced").addEventListener("click", () => {
  const advancedOptions = document.getElementById("advanced-options");
  if (advancedOptions.classList.contains("hidden")) {
    advancedOptions.classList.remove("hidden");
    document.getElementById("show-advanced").textContent =
      "Hide Advanced Options";
  } else {
    advancedOptions.classList.add("hidden");
    document.getElementById("show-advanced").textContent =
      "Show Advanced Options";
  }
});

// API handling functions
let currentCursor = null;
let currentPage = 1;

function formatDateTime(isoString) {
  if (!isoString) return "N/A";
  const date = new Date(isoString);
  return date.toLocaleString();
}

function getStatusClass(tag) {
  switch (tag) {
    case "Delivered":
      return "status-delivered";
    case "InTransit":
    case "OutForDelivery":
      return "status-transit";
    case "Exception":
    case "AttemptFail":
      return "status-exception";
    default:
      return "status-pending";
  }
}

async function makeApiRequest(endpoint, method = "GET", data = null) {
  const apiKey = document.getElementById("apiKey").value;
  if (!apiKey) {
    alert("Please enter your AfterShip API key");
    return null;
  }

  try {
    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
        "as-api-key": apiKey,
      },
    };

    if (data && method !== "GET") {
      options.body = JSON.stringify(data);
    }

    // Use our proxy server with proper URL encoding
    const proxyUrl = "https://nova-poshta-tracking.onrender.com";

    // Make sure endpoint starts with a slash if it doesn't already
    if (!endpoint.startsWith("/")) {
      endpoint = "/" + endpoint;
    }

    console.log("Making request to:", `${proxyUrl}${endpoint}`);

    const response = await fetch(`${proxyUrl}${endpoint}`, options);

    // Check if response is JSON
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error("Non-JSON response:", text);
      throw new Error("API returned non-JSON response. Check server logs.");
    }

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.meta?.message || "API request failed");
    }

    return result;
  } catch (error) {
    alert(`Error: ${error.message}`);
    console.error("API Error:", error);
    return null;
  }
}

// Single tracking form
document
  .getElementById("single-tracking-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const trackingNumber = document.getElementById("tracking-number").value;
    const courier = document.getElementById("courier").value;

    let endpoint = `/trackings/${trackingNumber}`;
    if (courier) {
      endpoint = `/trackings/${courier}/${trackingNumber}`;
    }

    const result = await makeApiRequest(endpoint);
    if (!result) return;

    const resultElement = document.getElementById("single-result");
    resultElement.classList.remove("hidden");

    const tracking = result.data.tracking;
    let html = `
            <div class="tracking-item">
                <div class="tracking-title">${tracking.tracking_number}</div>
                <div class="tracking-info">
                    <div class="tracking-detail"><strong>Courier:</strong> ${
                      tracking.slug
                    }</div>
                    <div class="tracking-detail"><strong>Last Updated:</strong> ${formatDateTime(
                      tracking.updated_at
                    )}</div>
                    <div class="tracking-detail"><strong>Created:</strong> ${formatDateTime(
                      tracking.created_at
                    )}</div>
                </div>
                <div class="tracking-status ${getStatusClass(tracking.tag)}">${
      tracking.tag
    }</div>
                
                <h3>Tracking History</h3>
        `;

    if (tracking.checkpoints && tracking.checkpoints.length > 0) {
      tracking.checkpoints.forEach((checkpoint) => {
        html += `
                    <div class="checkpoint">
                        <div class="checkpoint-date">${formatDateTime(
                          checkpoint.checkpoint_time
                        )}</div>
                        <div>${checkpoint.message}</div>
                        <div><strong>Location:</strong> ${
                          checkpoint.location || "N/A"
                        }</div>
                    </div>
                `;
      });
    } else {
      html += "<p>No tracking history available yet.</p>";
    }

    html += "</div>";
    resultElement.innerHTML = html;
  });

// Multiple tracking form
document
  .getElementById("multiple-tracking-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    currentCursor = null;
    currentPage = 1;
    await fetchMultipleTrackings();
  });

async function fetchMultipleTrackings() {
  const trackingNumbers = document.getElementById("tracking-numbers").value;
  const limit = document.getElementById("limit").value;
  const tag = document.getElementById("tag").value;
  const origin = document.getElementById("origin").value;
  const destination = document.getElementById("destination").value;
  const courierFilter = document.getElementById("courier-filter").value;
  const createdAfter = document.getElementById("created-after").value;
  const createdBefore = document.getElementById("created-before").value;
  const keyword = document.getElementById("keyword").value;

  // Fields to include
  const fields = [];
  document
    .querySelectorAll('input[type="checkbox"]:checked')
    .forEach((checkbox) => {
      fields.push(checkbox.value);
    });

  // Build query parameters
  let queryParams = `?limit=${limit}`;
  if (trackingNumbers)
    queryParams += `&tracking_numbers=${encodeURIComponent(trackingNumbers)}`;
  if (tag) queryParams += `&tag=${encodeURIComponent(tag)}`;
  if (origin) queryParams += `&origin=${encodeURIComponent(origin)}`;
  if (destination)
    queryParams += `&destination=${encodeURIComponent(destination)}`;
  if (courierFilter)
    queryParams += `&slug=${encodeURIComponent(courierFilter)}`;
  if (fields.length > 0)
    queryParams += `&fields=${encodeURIComponent(fields.join(","))}`;
  if (keyword) queryParams += `&keyword=${encodeURIComponent(keyword)}`;
  if (currentCursor)
    queryParams += `&cursor=${encodeURIComponent(currentCursor)}`;

  // Format dates
  if (createdAfter) {
    const date = new Date(createdAfter);
    queryParams += `&created_at_min=${encodeURIComponent(date.toISOString())}`;
  }
  if (createdBefore) {
    const date = new Date(createdBefore);
    queryParams += `&created_at_max=${encodeURIComponent(date.toISOString())}`;
  }

  const result = await makeApiRequest(`/trackings${queryParams}`);
  if (!result) return;

  const resultElement = document.getElementById("multiple-result");
  resultElement.classList.remove("hidden");

  const trackingsElement = document.getElementById("trackings-list");
  let html = "";

  if (result.data.trackings.length === 0) {
    html = "<p>No trackings found matching your criteria.</p>";
  } else {
    result.data.trackings.forEach((tracking) => {
      html += `
                    <div class="tracking-item">
                        <div class="tracking-title">${
                          tracking.tracking_number
                        }</div>
                        <div class="tracking-info">
                            <div class="tracking-detail"><strong>Courier:</strong> ${
                              tracking.slug
                            }</div>
                            <div class="tracking-detail"><strong>Last Updated:</strong> ${formatDateTime(
                              tracking.updated_at
                            )}</div>
                            <div class="tracking-status ${getStatusClass(
                              tracking.tag
                            )}">${tracking.tag}</div>
                        </div>
                    </div>
                `;
    });
  }

  trackingsElement.innerHTML = html;

  // Update pagination
  document.getElementById("page-info").textContent = `Page ${currentPage}`;
  document.getElementById("prev-page").disabled = currentPage === 1;
  document.getElementById("next-page").disabled =
    !result.data.pagination?.next_cursor;

  // Save cursor for next page
  if (result.data.pagination) {
    currentCursor = result.data.pagination.next_cursor;
  }
}

// Pagination handlers
document.getElementById("prev-page").addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    currentCursor = null; // Reset cursor to fetch from the beginning
    fetchMultipleTrackings();
  }
});

document.getElementById("next-page").addEventListener("click", () => {
  currentPage++;
  fetchMultipleTrackings();
});

// Create tracking form
document
  .getElementById("create-tracking-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const trackingNumber = document.getElementById("new-tracking-number").value;
    const courier = document.getElementById("new-courier").value;
    const title = document.getElementById("title").value;
    const orderId = document.getElementById("order-id").value;
    const customerName = document.getElementById("customer-name").value;
    const originCountry = document.getElementById("origin-country").value;
    const destinationCountry = document.getElementById(
      "destination-country"
    ).value;

    const payload = {
      tracking: {
        tracking_number: trackingNumber,
        slug: courier,
      },
    };

    if (title) payload.tracking.title = title;
    if (orderId) payload.tracking.order_id = orderId;
    if (customerName) {
      payload.tracking.customer_name = customerName;
    }
    if (originCountry) payload.tracking.origin_country_iso3 = originCountry;
    if (destinationCountry)
      payload.tracking.destination_country_iso3 = destinationCountry;

    const result = await makeApiRequest("/trackings", "POST", payload);
    if (!result) return;

    const resultElement = document.getElementById("create-result");
    resultElement.classList.remove("hidden");
    resultElement.innerHTML = `
            <div class="tracking-item">
                <h3>Tracking Created Successfully</h3>
                <div class="tracking-info">
                    <div class="tracking-detail"><strong>Tracking Number:</strong> ${
                      result.data.tracking.tracking_number
                    }</div>
                    <div class="tracking-detail"><strong>Courier:</strong> ${
                      result.data.tracking.slug
                    }</div>
                    <div class="tracking-detail"><strong>Created At:</strong> ${formatDateTime(
                      result.data.tracking.created_at
                    )}</div>
                </div>
            </div>
        `;
  });
