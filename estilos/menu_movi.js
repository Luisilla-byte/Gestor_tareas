// Manejo de secciones para scroll y links activos
const sections = document.querySelectorAll('section[id]');

function scrollActive() {
    const scrollY = window.pageYOffset + window.innerHeight / 2; // Ajuste para centrado

    sections.forEach(current => {
        const sectionHeight = current.offsetHeight;
        const sectionTop = current.offsetTop;
        const sectionId = current.getAttribute('id');

        const navLink = document.querySelector('.nav__list a[href*="' + sectionId + '"]');
        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
            navLink.classList.add('active-link');
        } else {
            navLink.classList.remove('active-link');
        }
    });
}

window.addEventListener('scroll', scrollActive);

// Código para ocultar todos los enlaces de navegación excepto "crear tarea" y eliminar específicamente el enlace de "inicio"
document.addEventListener('DOMContentLoaded', function () {
    const navLinks = document.querySelectorAll('.nav__link');
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === '#inicio') {
            link.remove(); // Eliminar el enlace de "inicio"
        } else if (href !== '#crear_tarea') {
            link.style.display = 'none'; // Ocultar otros enlaces excepto "crear tarea"
        }
    });

    // Inicializar la lista de tareas
    showNotes();
});

// Manejo de tareas
const addBox = document.querySelector(".add-box");
const popupBox = document.querySelector(".popup-box");
const popupTitle = popupBox.querySelector("header p");
const closeIcon = popupBox.querySelector("header i");
const titleTag = popupBox.querySelector("input");
const desctag = popupBox.querySelector("textarea");
const addBtn = popupBox.querySelector("button");
const statusSelect = document.querySelector(".status-select");
const taskList = document.querySelector(".task-list");

let isUpdate = false, updateId;

addBox.addEventListener("click", () => {
    titleTag.focus();
    popupBox.classList.add("show");
});

closeIcon.addEventListener("click", () => {
    isUpdate = false;
    titleTag.value = "";
    desctag.value = "";
    addBtn.innerText = "Agregar una Tarea";
    popupTitle.innerText = "Agregar nueva tarea";
    popupBox.classList.remove("show");
});

statusSelect.addEventListener("change", function() {
    const selectedStatus = this.value;
    const taskClass = selectedStatus === "Completada" ? 'completed' : 'pending';
    popupBox.classList.remove('completed', 'pending');
    popupBox.classList.add(taskClass);
});

// Función para formatear la fecha en formato YYYY-MM-DD
function formatDate(dateStr) {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

async function showNotes() {
    taskList.innerHTML = ""; // Limpiar el contenedor de tareas
    try {
        const response = await fetch('/tasks', { method: 'GET' });
        if (!response.ok) throw new Error('Error al obtener las tareas.');
        const notes = await response.json();
        console.log('Notas obtenidas:', notes); // Verifica los datos recibidos

        if (notes.length === 0) {
            console.log('No hay tareas para mostrar.');
            return;
        }

        notes.forEach(note => {
            // Usa 'status' para obtener la fecha y formatearla
            const formattedDate = formatDate(note.status);
            console.log('Fecha formateada:', formattedDate); // Verifica la fecha

            const taskClass = note.date === 'Completada' ? 'completed' : 'pending'; // Usa note.date como estado

            const liTag = `
                <li class="note ${taskClass}" data-id="${note.id}">
                    <div class="details">
                        <p>${note.title || 'Título no disponible'}</p>
                        <span>${note.description || 'Descripción no disponible'}</span>
                    </div>
                    <div class="bottom-content">
                        <span class="date">${formattedDate}</span>
                        <div class="setting">
                            <i onclick="showMenu(this, event)" class="ri-more-line"></i>
                            <ul class="menu">
                                <li onclick="updateNote(${note.id}, '${note.title || ''}', '${note.description || ''}')"><i class="ri-pencil-line"></i>Editar</li>
                                <li onclick="deleteNote(${note.id})"><i class="ri-delete-bin-6-line"></i>Borrar</li>
                            </ul>
                        </div>
                    </div>
                </li>`;
            taskList.insertAdjacentHTML("beforeend", liTag);
        });
    } catch (error) {
        console.error(error);
    }
}

function showMenu(elem, event) {
    event.stopPropagation();
    elem.parentElement.classList.add("show");
    document.addEventListener("click", e => {
        if (e.target.tagName !== "I" || e.target !== elem) {
            elem.parentElement.classList.remove("show");
        }
    });
}

async function deleteNote(noteId) {
    const confirmDel = confirm("¿Estás seguro que quieres borrar esta tarea?");
    if (!confirmDel) return;
    try {
        const response = await fetch(`/tasks/${noteId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Error al eliminar la nota.');
        const result = await response.json();
        console.log(result.message);
        showNotes();
    } catch (error) {
        console.error('Error al eliminar la nota:', error);
    }
}

async function updateNote(noteId, title, description) {
    isUpdate = true;
    updateId = noteId;
    titleTag.value = title;
    desctag.value = description;
    addBtn.innerText = "Actualizar Tarea";
    popupTitle.innerText = "Actualizar Tarea";
    popupBox.classList.add("show");
}

addBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    const noteTitle = titleTag.value.trim();
    const noteDesc = desctag.value.trim();
    const noteStatus = statusSelect.value;

    if (noteTitle || noteDesc) {
        const dateObj = new Date();
        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = String(dateObj.getMonth() + 1).padStart(2, '0'); // Mes con dos dígitos
        const year = dateObj.getFullYear();

        const noteInfo = {
            title: noteTitle,
            description: noteDesc,
            date: `${year}-${month}-${day}`, // Formato ISO: YYYY-MM-DD
            status: noteStatus
        };

        try {
            let response;
            if (!isUpdate) {
                response = await fetch('/tasks', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(noteInfo)
                });
            } else {
                response = await fetch(`/tasks/${updateId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(noteInfo)
                });
            }
            if (!response.ok) throw new Error('Error al agregar o actualizar la tarea.');
            const result = await response.json();
            console.log(result);
            isUpdate = false;
            closeIcon.click();
            showNotes(); // Recargar la lista de tareas para reflejar el cambio
        } catch (error) {
            console.error('Error al agregar o actualizar la tarea:', error);
        }
    } else {
        console.log('Título o descripción de la tarea vacíos.');
    }
});






