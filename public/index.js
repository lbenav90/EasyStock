import FormElement from './customElements/FormElement.js'
import { checkValidInputs, getFormValues, showPage, emptyFormAlerts, getUniqueCode, addNewItem, displayStock, prepLowStockOrder } from "./funciones.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.9.3/firebase-app.js";
import { getDatabase, set, ref } from "https://www.gstatic.com/firebasejs/9.9.3/firebase-database.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, setPersistence, browserLocalPersistence, sendPasswordResetEmail, signInWithEmailAndPassword, sendEmailVerification } from "https://www.gstatic.com/firebasejs/9.9.3/firebase-auth.js";


const firebaseConfig = {
  apiKey: "AIzaSyDh61PbaLfVPrNsFgbiMWuN2IgZhPhSpKs",
  authDomain: "stock-ce94d.firebaseapp.com",
  databaseURL: "https://stock-ce94d-default-rtdb.firebaseio.com",
  projectId: "stock-ce94d",
  storageBucket: "stock-ce94d.appspot.com",
  messagingSenderId: "600515267172",
  appId: "1:600515267172:web:a3bbfc1b57cb96e314ed71",
  measurementId: "G-QRKF7KYDBN",
  databaseURL: "https://stock-ce94d-default-rtdb.firebaseio.com"
};

// Initialize Firebase
const app = await initializeApp(firebaseConfig);
const auth = await getAuth(app);
setPersistence(auth, browserLocalPersistence);

!customElements.get('form-element')? customElements.define('form-element', FormElement): 1;//pass

// Checks the status of the user session and displays appropiate button
onAuthStateChanged(auth, (user) => {
    if (user) {
        document.querySelector('#login-but').style.display = 'none';
        document.querySelector('#logout-but').style.display = 'block';
        displayStock();
    } else {
        document.querySelector('#login-but').style.display = 'block';
        document.querySelector('#logout-but').style.display = 'none';
    }
    
    document.querySelector('#loading').style.display = 'none';
}) 

document.addEventListener('DOMContentLoaded', () => {

    showPage('login');

    document.querySelector('#add-item-but').addEventListener('click', () => {
        const auth = getAuth();

        if (!auth.currentUser) {
            showPage('login')
            Toastify({
                text: 'Debe iniciar sesi??n',
                duration: 5000,
                position: 'center',
                gravity: 'top'  
            }).showToast()
            return;
        }

        showPage('add-item-div');

        // Creo un formulario en modo 'add' con un customElement
        const newForm = document.createElement('form-element');
        
        newForm.addEventListener('submit', async (event) => {
            event.preventDefault()

            emptyFormAlerts('add');

            const inputs = getFormValues();

            if (!checkValidInputs(-1, ...inputs, 'add')) return;

            // Defino un nuevo item y muestro el stock
            const newItemCode = getUniqueCode(5);
            const newItem = {
                code: newItemCode,
                name: inputs[0],
                brand: inputs[1],
                quantity: inputs[2],
                minQuantity: inputs[3],
                presentation: inputs[4],
                description: inputs[5],
                category: inputs[6]
            }
            addNewItem(newItem);

            displayStock();
        });

        document.querySelector('#add-item-div').append(newForm);

        const categoryOptions = document.querySelector('#item-category').children.length;

        // Si hay al menos una categor??a agregada, esconder el input de nueva categor??a
        categoryOptions != 1 && (document.querySelector('#item-newCategory-row').style.display = 'none');

        document.querySelector('#item-category').addEventListener('change', () => {
            // Si el usuario elige la opci??n de nueva categor??a, mostrar el input escondido
            const selected = document.querySelector('#item-category').value;
            
            if (selected === 'new') { 
                document.querySelector('#item-newCategory-row').style.display = 'table-row';
            } else {
                document.querySelector('#item-newCategory-row').style.display = 'none';
                document.querySelector('#item-newCategory-row').value = '';
            }
        })
        
        // Bot??n para volver al stock
        document.querySelector('#return-but').addEventListener('click', displayStock);
    })

    // Bot??n para mostrar el stock actualizado
    document.querySelector('#show-stock-but').addEventListener('click', displayStock);
    
    // Ordena el stock seg??n la categor??a seleccionada
    document.querySelector('#order-by').addEventListener('change', () => {
        // Obtengo el par??metro de orden y las filas de la tabla
        const order = document.querySelector('#order-by').value;
        const tableRows = document.querySelectorAll('.stock-item-row');
        
        const currentStock = JSON.parse(sessionStorage.getItem('current-stock'));
        let itemA, itemB;
        
        const tableRowsArray = Array.prototype.slice.call(tableRows, 0);
        
        // Ordeno las filas de la tabla seg??n el par??metro de orden
        tableRowsArray.sort((a, b) => {
            itemA = currentStock[a.id.split('-')[2]];
            itemB = currentStock[b.id.split('-')[2]];

            if (itemA[order] > itemB[order]){
                return 1
            } else if (itemA[order] < itemB[order]) {
                return -1
            }
            return 0;
        })
        
        // Obtengo el cuerpo de la tabla (dependiendo de si es la tabla de stock o de bajo stock)
        const stockVisible = document.querySelector('#stock-div').style.display === 'block';
        const tableBody = stockVisible? document.querySelector('#stock-table-body'): document.querySelector('#low-stock-table-body');
        
        // Remuevo los nodos del cuerpo
        while (tableBody.firstChild) {
            tableBody.removeChild(tableBody.firstChild);
        };

        // Agrego las filas ordenadas
        tableBody.append(...tableRowsArray);
    });

    // Barra de b??squeda, sin bot??n de buscar
    document.querySelector('#search-bar').addEventListener('keyup', () => {
        const query = document.querySelector('#search-bar').value.toLowerCase();
        const tableRows = document.querySelectorAll('.stock-item-row');
        let tableData, searchHit, item;

        let currentCategory = document.querySelector(`#category-select`).value;
        let currentStock = JSON.parse(sessionStorage.getItem('current-stock'));

        tableRows.forEach((row) => {
            searchHit = false;

            item = currentStock[row.id.split('-')[2]];

            tableData = row.querySelectorAll('td');
            tableData.forEach((cell) => {
                // Chequear en cada celda si contiene el valor buscado 'query'
                cell.innerText.toLowerCase().includes(query) && (searchHit = true);

            });

            // El condicional externo permite filtrar la busqueda por al categor??a actualmente seleccionada automaticamente
            if (currentCategory === 'all') {
                row.style.display = searchHit? 'table-row' : 'none';
            } else {
                row.style.display = (searchHit && currentCategory === item.category)? 'table-row' : 'none';
            }
        })
        
    })
    
    // Muestra la tabla con los ??tems con bajo stock
    document.querySelector('#prep-order-but').addEventListener('click', prepLowStockOrder);

    document.querySelector('#login-but').onclick = () => { showPage('login') }

    document.querySelector('#sign-up-link').onclick = () => { showPage('sign-up') }

    document.querySelector('#reset-pass-link').onclick = async () => {
        // TODO
    }

    document.querySelector('#logout-but').onclick = async () => {
        try {
            auth.signOut();
            showPage('login');
        } catch (error) {
            console.log(error.code);
            console.log(error.message);
        }
    }

    document.querySelector('#sign-up-form').addEventListener('submit', async (event) => {
        event.preventDefault();

        const email = document.querySelector('#sign-up-input-email').value;
        const password = document.querySelector('#sign-up-input-password').value;
        const rePassword = document.querySelector('#sign-up-input-re-password').value;

        if (password != rePassword) {
            document.querySelector('#sign-up-error').innerText = 'Las contrase??as no coinciden';
            return;
        } 

        if (password.length < 6) {
            document.querySelector('#sign-up-error').innerText = 'La contrase??a debe tener \nal menos 6 caracteres';
            return;
        } 

        try {
            const userCredentials = await createUserWithEmailAndPassword(auth, email, password);
            sendEmailVerification(userCredentials.user);

            const stockDB = await getDatabase(app);
            set(ref(stockDB, `users/${userCredentials.user.uid}`), {})
        } catch (error) {
            if (error.code === 'auth/email-already-in-use') {
                document.querySelector('#sign-up-error').innerText = 'Email ya existente';
            } else {
                console.log(error.code);
                console.log(error.message);
                document.querySelector('#sign-up-error').innerText = 'Algo fall??';
            }
        }
        
    })

    document.querySelector('#login-form').addEventListener('submit', async (event) => {
        event.preventDefault();

        const email = document.querySelector('#login-input-email').value;
        const password = document.querySelector('#login-input-password').value;

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
                document.querySelector('#login-error').innerText = 'Usuario y/o contrase??a \nincorrecto/s';
            } else if(error.code === 'auth/too-many-requests') {
                document.querySelector('#login-error').innerText = 'Demasiados intentos fallidos\nResetear contrase??a';
            } else {
                console.log(error.code);
                console.log(error.message);
                document.querySelector('#login-error').innerText = 'Algo fall??';
            }
        }
    })
})