const memberForm = document.getElementById('memberForm');
const membersUl = document.getElementById('membersUl');

const members = [];

memberForm.addEventListener('submit', function(event) {
  event.preventDefault();

  const fullName = memberForm.fullName.value.trim();
  const email = memberForm.email.value.trim();
  const phone = memberForm.phone.value.trim();

  if (fullName && email) {
    const member = { fullName, email, phone };
    members.push(member);

    // Add member to UI list
    const li = document.createElement('li');
    li.textContent = `${fullName} (${email}${phone ? ', ' + phone : ''})`;
    membersUl.appendChild(li);

    // Clear form fields
    memberForm.reset();
  } else {
    alert('Please complete at least name and email fields.');
  }
});
