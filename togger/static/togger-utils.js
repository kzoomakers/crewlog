// Update hidden start/end fields when date/time inputs change in event modal
function updateDateTime() {
    const startDate = document.getElementById('startDate');
    const startTime = document.getElementById('startTime');
    const endDate = document.getElementById('endDate');
    const endTime = document.getElementById('endTime');
    const startField = document.getElementById('start');
    const endField = document.getElementById('end');
    
    // Only update if the visible date/time fields exist and have values
    if (startDate && startTime && startField && startDate.value && startTime.value) {
        const newStartValue = startDate.value + 'T' + startTime.value + ':00';
        startField.value = newStartValue;
        console.log('Updated start:', newStartValue);
    }
    if (endDate && endTime && endField && endDate.value && endTime.value) {
        const newEndValue = endDate.value + 'T' + endTime.value + ':00';
        endField.value = newEndValue;
        console.log('Updated end:', newEndValue);
    }
}

function submit_modal(form, modal, url, method) {
    console.log('submit_modal called with url:', url);
    
    // Update datetime before submitting (only if date/time fields exist)
    if (document.getElementById('startDate') && document.getElementById('startTime')) {
        updateDateTime();
    }
    
    if (form.checkValidity() == false) {
        console.log('Form validation failed');
        form.reportValidity();
        return;
    }
    if(typeof method === "undefined")
        {method = 'POST';}
    
    console.log('Sending request...');
    var request = new XMLHttpRequest();
    formData = new FormData(form);
    
    // Log form data
    for (var pair of formData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
    }
    
    request.onload = function() {
        console.log('Response status:', this.status);
        if (this.status >= 200 && this.status < 400) {
            $(modal).modal('hide')
            if (this.responseURL.includes('/users/password')){
                window.location.replace("/")
            } else {
                console.log('Refetching events...');
                calendar.refetchEvents()
            }
        } else {
            console.log('Error response:', this.response);
            document
                .getElementById("modalContent")
                .innerHTML = this.response
        }
    };
    request.onerror = function() {
        console.log('Request error');
    };
    request.open(method, url);
    // Send our FormData object; HTTP headers are set automatically
    request.send(formData);
}

function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator
        .userAgent
    )
}

function loadSettings() {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            settings = JSON.parse(this.responseText)
            for (let [key, value] of Object.entries(settings)) {
                calendar.setOption(`${key}`, `${value}`);
            }
        }
    };
    xhttp.open("GET", "/get_settings", true);
    xhttp.send();
}

function renderModal(url) {
    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.onload = function() {
        if (this.status >= 200 && this.status < 400) {
            document
                .getElementById("modalContent")
                .innerHTML = this.response
            $("#modal").modal()
        }
    };
    request.send();
}


function newShare(form, modal, url) {
    var request = new XMLHttpRequest();
    formData = new FormData(form);
    request.onload = function() {
        if (this.status >= 200 && this.status < 400) {
            document.getElementById('roleName').style.display = "none";
            document.getElementById('buttonCopyShare').style.display = "initial"
            document.getElementById("shareUrl").value = this.response;
        }
    };
    request.open('POST', url);
    // Send our FormData object; HTTP headers are set automatically
    request.send(formData);
}

function copyText(inputField) {
    /* Select the text field */
    inputField.select();
    inputField.setSelectionRange(0, 99999); /*For mobile devices*/
    /* Copy the text inside the text field */
    document.execCommand("copy");
}

function changeShare(form, url, confirm) {
    var request = new XMLHttpRequest();
    formData = new FormData(form);
    console.log(formData);
    if (!confirm && formData.get('roleNameShares') >= 100) {
        renderModal("/render_transfer_ownership?form_id="+form.id);
        return
    }
    request.open('PUT', url);
    request.onload = function() {
        if (this.status >= 200 && this.status < 400) {
            window.location.replace("/shares")
        }
    };
    request.send(formData);
}

function signMyself(firstName, lastName) {
    document
        .getElementById("newName")
        .value = firstName + " " + lastName
}

function getTimeZone() {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
}

if (!isMobile()) {
    $(document).on('shown.bs.modal', function(e) {
        $('[autofocus]', e.target).focus();
    });
}


$(document).on('shown.bs.modal', function(e) {
    $('[data-toggle="popover"]').popover()
});