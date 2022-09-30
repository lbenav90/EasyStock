import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/9.9.3/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.9.3/firebase-auth.js";

/**
 * Esta clase define un customElement para usar en la tabla de stock
 * Contiene la cantidad del ítem en stock y dos botones, para aumentar y baar el stock, con sus funcionalidades agregadas
 */
export default class QuantityDiv extends HTMLElement {
    constructor() {
        super();
    }
    connectedCallback() {
        this.innerHTML = '';
        
        let quantity = this.getAttribute('quantity') || 0;
        let itemCode = this.getAttribute('itemCode') || null;

        let div = document.createElement('div');
        div.className = 'quantity-div';

        let span = document.createElement('span');
        span.className = 'quantity-span';
        span.id = `quantity-span-${itemCode}`;
        span.innerText = quantity;

        let butDiv = document.createElement('div');
        butDiv.className = 'quantity-but-div';
        
        // Boton para aumentar el stock
        let plus = document.createElement('button');
        plus.className = 'quantity-but quantity-plus';
        plus.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-caret-up-fill" viewBox="0 0 16 16"><path d="m7.247 4.86-4.796 5.481c-.566.647-.106 1.659.753 1.659h9.592a1 1 0 0 0 .753-1.659l-4.796-5.48a1 1 0 0 0-1.506 0z"/></svg>';
        
        plus.addEventListener('click', async (event) => {
            event.stopPropagation();

            // Obtengo la canidad actual y la aumento en 1
            let currentQuantity = parseInt(document.querySelector(`#quantity-span-${itemCode}`).innerText);
            document.querySelector(`#quantity-span-${itemCode}`).innerText = currentQuantity + 1;

            // Actualizo el stock actual en el sessionStorage
            const currentStock = JSON.parse(sessionStorage.getItem('current-stock'));
            currentStock[itemCode].quantity = currentQuantity + 1;
            sessionStorage.setItem('current-stock', JSON.stringify(currentStock));

            // Actualizo únicamente la cantidad de ese ítem. Esto me evita modificar todo el ítem
            try {
                const stockDB = await getDatabase();
                const uid = getAuth().currentUser.uid;
                await set(ref(stockDB, `users/${uid}/items/${itemCode}/quantity`), currentQuantity + 1);
            } catch (error) {
                Toastify({
                    text: 'Algo salió mal',
                    duration: 5000,
                    position: 'center',
                    gravity: 'top'
                }).showToast();
                console.log(error.code);
                console.log(error.message);
                return;
            }
        });

        // Boton para bajar el stock
        let minus = document.createElement('button');
        minus.className = 'quantity-but quantity-minus'
        minus.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-caret-down-fill" viewBox="0 0 16 16"><path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/></svg>';

        minus.addEventListener('click', async (event) => {
            event.stopPropagation();

            // Mismo procedimiento pero no permite bajar de 0 la cantidad
            let currentQuantity = parseInt(document.querySelector(`#quantity-span-${itemCode}`).innerText);

            if (currentQuantity === 0) return;

            document.querySelector(`#quantity-span-${itemCode}`).innerText = currentQuantity - 1;

            const currentStock = JSON.parse(sessionStorage.getItem('current-stock'));
            currentStock[itemCode].quantity = currentQuantity - 1;
            sessionStorage.setItem('current-stock', JSON.stringify(currentStock));

            try {
                const stockDB = await getDatabase();
                const uid = getAuth().currentUser.uid;
                await set(ref(stockDB, `users/${uid}/items/${itemCode}/quantity`), currentQuantity - 1);
            } catch (error) {
                Toastify({
                    text: 'Algo salió mal',
                    duration: 5000,
                    position: 'center',
                    gravity: 'top'
                }).showToast();
                console.log(error.code);
                console.log(error.message);
                return;
            }
        });

        butDiv.append(plus, minus);

        div.append(span, butDiv);
        
        this.append(div);
    }
    static get observedAttributes() {
        return ['quantity', 'itemCode'];
    }

    // Setters y getters de las propiedades de la clase
    get quantity() { return this.hasAttribute('quantity'); }
    get itemCode() { return this.hasAttribute('itemCode'); }

    set quantity(val) { val? this.setAttribute('quantity', val) : this.removeAttribute('quantity'); }
    set itemCode(val) { val? this.setAttribute('itemCode', val) : this.removeAttribute('itemCode'); }

}