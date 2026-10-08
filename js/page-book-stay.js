// Delaware Run Farm — book-a-stay page. Turns the plain checkin/checkout
// text inputs into flatpickr calendars with every blocked_dates range
// (other platforms' bookings, entered by the owner in the admin page)
// greyed out and unselectable. If the sheet isn't reachable, the
// calendars still work - they just won't know about blocked dates yet.
import { fetchTab } from "./data-reader.js";

const MIN_NIGHTS = 2;

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

document.addEventListener("DOMContentLoaded", async () => {
  const checkinEl = document.querySelector("#checkin");
  const checkoutEl = document.querySelector("#checkout");
  const note = document.querySelector("[data-availability-note]");
  if (!checkinEl || !checkoutEl || typeof flatpickr === "undefined") return;

  let disableRanges = [];
  try {
    const rows = await fetchTab("blocked_dates");
    disableRanges = rows
      .filter((r) => r.start_date && r.end_date)
      .map((r) => ({ from: r.start_date, to: r.end_date }));
    if (note) {
      note.textContent = disableRanges.length
        ? "Greyed-out dates are already booked elsewhere - everything else shown is open."
        : "All dates shown are currently open.";
    }
  } catch (err) {
    console.warn("Could not load blocked dates, showing an open calendar.", err);
    if (note) note.textContent = "";
  }

  const checkoutPicker = flatpickr(checkoutEl, {
    dateFormat: "Y-m-d",
    minDate: addDays(new Date(), MIN_NIGHTS),
    disable: disableRanges,
  });

  flatpickr(checkinEl, {
    dateFormat: "Y-m-d",
    minDate: "today",
    disable: disableRanges,
    onChange: (selectedDates) => {
      if (!selectedDates[0]) return;
      const minCheckout = addDays(selectedDates[0], MIN_NIGHTS);
      checkoutPicker.set("minDate", minCheckout);
      if (checkoutPicker.selectedDates[0] && checkoutPicker.selectedDates[0] < minCheckout) {
        checkoutPicker.clear();
      }
    },
  });
});
