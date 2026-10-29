cd ~/Desktop/ai-lost-found-management-system

cat > script.js <<'EOF'
let items = JSON.parse(localStorage.getItem("lostFoundItems")) || [];

let selectedType = "Lost";

function selectType(type, button) {
  selectedType = type;

  document.getElementById("reportType").value = type;

  document.querySelectorAll(".type-btn").forEach(btn => {
    btn.classList.remove("active");
  });

  button.classList.add("active");
}

function submitItem() {

  const itemName = document.getElementById("itemName").value.trim();
  const category = document.getElementById("category").value;
  const colour = document.getElementById("colour").value.trim();
  const location = document.getElementById("location").value.trim();
  const description = document.getElementById("description").value.trim();
  const message = document.getElementById("formMessage");

  if (!itemName || !category || !colour || !location || !description) {
    message.textContent = "Please fill in all the fields.";
    message.style.color = "#dc2626";
    return;
  }

  const newItem = {
    id: Date.now(),
    type: selectedType,
    name: itemName,
    category: category,
    colour: colour,
    location: location,
    description: description,
    date: new Date().toLocaleDateString()
  };

  items.push(newItem);

  localStorage.setItem(
    "lostFoundItems",
    JSON.stringify(items)
  );

  message.textContent =
    `${selectedType} item reported successfully.`;

  message.style.color = "#059669";

  clearForm();

  displayItems();
  displayMatches();

  setTimeout(() => {
    message.textContent = "";
  }, 3000);
}

function clearForm() {

  document.getElementById("itemName").value = "";
  document.getElementById("category").value = "";
  document.getElementById("colour").value = "";
  document.getElementById("location").value = "";
  document.getElementById("description").value = "";
}

function getIcon(category) {

  const icons = {
    Electronics: "💻",
    Documents: "📄",
    Accessories: "🎒",
    Books: "📚",
    Clothing: "👕",
    Keys: "🔑",
    Other: "📦"
  };

  return icons[category] || "📦";
}

function displayItems() {

  const container = document.getElementById("itemsContainer");

  const searchText =
    document.getElementById("searchInput").value
      .toLowerCase()
      .trim();

  const filter =
    document.getElementById("statusFilter").value;

  let filteredItems = items.filter(item => {

    const searchableText = `
      ${item.name}
      ${item.category}
      ${item.colour}
      ${item.location}
      ${item.description}
    `.toLowerCase();

    const matchesSearch =
      searchableText.includes(searchText);

    const matchesFilter =
      filter === "All" ||
      item.type === filter;

    return matchesSearch && matchesFilter;
  });

  if (filteredItems.length === 0) {

    container.innerHTML = `
      <div class="empty">
        <h3>No items found</h3>
        <p>Try another search or report a new item.</p>
      </div>
    `;

    return;
  }

  container.innerHTML = filteredItems
    .map(item => createItemCard(item))
    .join("");
}

function createItemCard(item) {

  const statusClass =
    item.type.toLowerCase();

  return `
    <div class="item-card">

      <div class="item-top">

        <div class="item-icon">
          ${getIcon(item.category)}
        </div>

        <span class="status ${statusClass}">
          ${item.type}
        </span>

      </div>

      <h3>${escapeHTML(item.name)}</h3>

      <p>
        <strong>Category:</strong>
        ${escapeHTML(item.category)}
      </p>

      <p>
        <strong>Colour:</strong>
        ${escapeHTML(item.colour)}
      </p>

      <p>
        <strong>Location:</strong>
        ${escapeHTML(item.location)}
      </p>

      <p>
        <strong>Description:</strong>
        ${escapeHTML(item.description)}
      </p>

      <p>
        <strong>Reported:</strong>
        ${item.date}
      </p>

    </div>
  `;
}

function calculateMatchScore(lost, found) {

  let score = 0;

  if (
    lost.name.toLowerCase() ===
    found.name.toLowerCase()
  ) {
    score += 35;
  } else if (
    lost.name.toLowerCase().includes(
      found.name.toLowerCase()
    ) ||
    found.name.toLowerCase().includes(
      lost.name.toLowerCase()
    )
  ) {
    score += 25;
  }

  if (
    lost.category.toLowerCase() ===
    found.category.toLowerCase()
  ) {
    score += 25;
  }

  if (
    lost.colour.toLowerCase() ===
    found.colour.toLowerCase()
  ) {
    score += 15;
  }

  if (
    lost.location.toLowerCase() ===
    found.location.toLowerCase()
  ) {
    score += 15;
  }

  const lostWords =
    lost.description.toLowerCase().split(/\s+/);

  const foundWords =
    found.description.toLowerCase().split(/\s+/);

  const commonWords =
    lostWords.filter(
      word =>
        word.length > 3 &&
        foundWords.includes(word)
    );

  if (commonWords.length > 0) {
    score += Math.min(commonWords.length * 3, 10);
  }

  return Math.min(score, 100);
}

function displayMatches() {

  const container =
    document.getElementById("matchesContainer");

  const lostItems =
    items.filter(item => item.type === "Lost");

  const foundItems =
    items.filter(item => item.type === "Found");

  let matches = [];

  lostItems.forEach(lost => {

    foundItems.forEach(found => {

      const score =
        calculateMatchScore(lost, found);

      if (score >= 40) {

        matches.push({
          lost,
          found,
          score
        });

      }

    });

  });

  matches.sort((a, b) => b.score - a.score);

  if (matches.length === 0) {

    container.innerHTML = `
      <div class="empty">
        <h3>No possible matches yet</h3>
        <p>
          Add both lost and found reports
          to activate smart matching.
        </p>
      </div>
    `;

    return;
  }

  container.innerHTML = matches
    .map(match => createMatchCard(match))
    .join("");
}

function createMatchCard(match) {

  return `
    <div class="match-card">

      <h3>
        ${getIcon(match.lost.category)}
        Possible Match
      </h3>

      <p>
        <strong>Lost:</strong>
        ${escapeHTML(match.lost.name)}
      </p>

      <p>
        <strong>Found:</strong>
        ${escapeHTML(match.found.name)}
      </p>

      <p>
        <strong>Category:</strong>
        ${escapeHTML(match.lost.category)}
      </p>

      <p>
        <strong>Lost Location:</strong>
        ${escapeHTML(match.lost.location)}
      </p>

      <p>
        <strong>Found Location:</strong>
        ${escapeHTML(match.found.location)}
      </p>

      <span class="match-score">
        AI Match Confidence: ${match.score}%
      </span>

    </div>
  `;
}

function escapeHTML(text) {

  const div = document.createElement("div");
  div.textContent = text;

  return div.innerHTML;
}

function loadDemoData() {

  if (items.length > 0) {
    return;
  }

  items = [
    {
      id: 1,
      type: "Lost",
      name: "Black Wallet",
      category: "Accessories",
      colour: "Black",
      location: "Library",
      description: "Black leather wallet with cards",
      date: new Date().toLocaleDateString()
    },

    {
      id: 2,
      type: "Found",
      name: "Black Wallet",
      category: "Accessories",
      colour: "Black",
      location: "Library",
      description: "Black leather wallet found near table",
      date: new Date().toLocaleDateString()
    }
  ];

  localStorage.setItem(
    "lostFoundItems",
    JSON.stringify(items)
  );
}

document.addEventListener("DOMContentLoaded", () => {

  loadDemoData();

  displayItems();
  displayMatches();

});
EOF