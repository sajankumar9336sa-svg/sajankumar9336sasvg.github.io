const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");

const videoCards = document.querySelectorAll(".video-card");
const noResults = document.getElementById("noResults");

const uploadBtn = document.getElementById("uploadBtn");
const uploadModal = document.getElementById("uploadModal");
const closeModal = document.getElementById("closeModal");


// Open / close sidebar
menuBtn.addEventListener("click", () => {
    sidebar.classList.toggle("show");
});


// Search videos
function searchVideos() {

    const searchText =
        searchInput.value.toLowerCase().trim();

    let found = false;

    videoCards.forEach(card => {

        const title =
            card.dataset.title.toLowerCase();

        if (title.includes(searchText)) {

            card.style.display = "";
            found = true;

        } else {

            card.style.display = "none";

        }

    });

    noResults.style.display =
        found ? "none" : "block";
}


// Search button
searchBtn.addEventListener("click", searchVideos);


// Enter key search
searchInput.addEventListener("keyup", event => {

    if (event.key === "Enter") {
        searchVideos();
    }

});


// Category buttons
const categories =
    document.querySelectorAll(".category");

categories.forEach(category => {

    category.addEventListener("click", () => {

        categories.forEach(item => {
            item.classList.remove("active-category");
        });

        category.classList.add("active-category");

        const selected =
            category.textContent.trim();

        let found = false;

        videoCards.forEach(card => {

            if (
                selected === "All" ||
                card.dataset.category === selected
            ) {

                card.style.display = "";
                found = true;

            } else {

                card.style.display = "none";

            }

        });

        noResults.style.display =
            found ? "none" : "block";

    });

});


// Open upload window
uploadBtn.addEventListener("click", () => {

    uploadModal.style.display = "flex";

});


// Close upload window
closeModal.addEventListener("click", () => {

    uploadModal.style.display = "none";

});


// Close modal when clicking outside
uploadModal.addEventListener("click", event => {

    if (event.target === uploadModal) {
        uploadModal.style.display = "none";
    }

});
const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");

const videoCards = document.querySelectorAll(".video-card");
const noResults = document.getElementById("noResults");

const uploadBtn = document.getElementById("uploadBtn");
const uploadModal = document.getElementById("uploadModal");
const closeModal = document.getElementById("closeModal");
const publishBtn = document.getElementById("publishBtn");

const videoTitle = document.getElementById("videoTitle");
const videoFile = document.getElementById("videoFile");


/* Sidebar */

menuBtn.addEventListener("click", () => {
  sidebar.classList.toggle("show");
});


/* Search */

function searchVideos() {

  const searchText =
    searchInput.value.toLowerCase().trim();

  let found = false;

  videoCards.forEach(card => {

    const title =
      card.dataset.title.toLowerCase();

    if (title.includes(searchText)) {
      card.style.display = "";
      found = true;
    } else {
      card.style.display = "none";
    }

  });

  noResults.style.display =
    found ? "none" : "block";
}

searchBtn.addEventListener("click", searchVideos);

searchInput.addEventListener("keyup", event => {

  if (event.key === "Enter") {
    searchVideos();
  }

});


/* Category filter */

const categories =
  document.querySelectorAll(".category");

categories.forEach(category => {

  category.addEventListener("click", () => {

    categories.forEach(item => {
      item.classList.remove("active-category");
    });

    category.classList.add("active-category");

    const selected =
      category.textContent.trim();

    videoCards.forEach(card => {

      if (
        selected === "All" ||
        card.dataset.category === selected
      ) {
        card.style.display = "";
      } else {
        card.style.display = "none";
      }

    });

  });

});


/* Upload modal */

uploadBtn.addEventListener("click", () => {
  uploadModal.style.display = "flex";
});

closeModal.addEventListener("click", () => {
  uploadModal.style.display = "none";
});


/* Publish */

publishBtn.addEventListener("click", () => {

  const title = videoTitle.value.trim();
  const file = videoFile.files[0];

  if (!title) {
    alert("Please enter a video title.");
    return;
  }

  if (!file) {
    alert("Please select a video.");
    return;
  }

  alert(
    "Video selected successfully!\n\n" +
    "Title: " + title +
    "\nFile: " + file.name
  );

  uploadModal.style.display = "none";

  videoTitle.value = "";
  videoFile.value = "";

});


/* Close modal by clicking outside */

uploadModal.addEventListener("click", event => {

  if (event.target === uploadModal) {
    uploadModal.style.display = "none";
  }

});
