import Vue from 'vue'
import * as types from '../mutations-types'
import {db} from '../../db/config'
import {Toast} from 'buefy/dist/components/toast'
import {i18n} from '../../lang/lang'

const state = {
    userCart: []
};

const mutations = {
    [types.UPDATE_CHECKOUT] (state, {product, isAdd, quantity}) {
        if (isAdd) {
            let id = product.id;
            let index = state.userCart.map((el) => {return el.id}).indexOf(id);
            if (index > -1) {
                Vue.set(state.userCart[index], 'quantity', quantity);
            }
        } else {
            state.userCart.push(product);
        }
    },

    [types.UPDATE_CHECKOUT_FROM_DB] (state, items) {
        state.userCart = items;
    },

    [types.REMOVE_FROM_CHECKOUT] (state, {id}) {
        let index = state.userCart.map((el) => {return el.id}).indexOf(id);
        let currQuantity = state.userCart[index].quantity - 1;

        if (index > -1) {
            if (currQuantity > 0) {
                Vue.set(state.userCart[index], 'quantity', currQuantity);
            } else {
                state.userCart.splice(index, 1);
            }
        }
    }
};

const actions = {
    updateCheckout(context, removing) {
        let uid = context.rootGetters.currentUser.uid;
        db.ref('carts/' + uid)
            .set(context.getters.userCart)
            .then(() => {
                if (!removing) {
                    Toast.open({
                        duration: 500,
                        message: i18n.t('added'),
                        type: 'is-success'
                    })
                } else {
                    Toast.open({
                        duration: 500,
                        message: i18n.t('removed'),
                        type: 'is-success'
                    })
                }
            })
            .catch((err) => {
                Toast.open({
                    duration: 2000,
                    message: err.message,
                    type: 'is-danger'
                });
            });
    },

    addToCheckout(context, {product, category, subCategory}) {
        let userCartGetter = context.getters.userCart;
        let record = userCartGetter.filter(el => {
            return el.id == product.id
        });
        let isAdd = false;
        let quantity = 1;
        let prevQuantity;

        if (record.length > 0) {
            isAdd = !isAdd;
            prevQuantity = record[0].quantity;
            quantity = prevQuantity + 1;
        }

        product = { ...product, category, subCategory };
        product.quantity = quantity;
        context.commit(types.UPDATE_CHECKOUT, {product, isAdd, quantity});
        context.dispatch('updateCheckout', false);
    },

    removeFromCheckout(context, id) {
        let removing = true;
        context.commit(types.REMOVE_FROM_CHECKOUT, {id});
        context.dispatch('updateCheckout', removing);
    },

    getCartFromDB(context, user) {
        let uid = user.uid;
        db.ref('carts/' + uid).once('value')
            .then((data) => {
                if (data.val()) {
                    context.commit(types.UPDATE_CHECKOUT_FROM_DB, data.val());
                    context.commit(types.LOADED);
                }
            })
            .catch((err) => {
                Toast.open({
                    duration: 2000,
                    message: err.message,
                    type: 'is-danger'
                });
            })
    },

    submitCheckout(context) {
        if (!context.rootGetters.currentUser.uid) {
            Toast.open({
                duration: 2000,
                message: i18n.t('auth.continue'),
                type: 'is-danger'
            });
        }
    },
};

const getters = {
    userCart: (state) => {
        return state.userCart
    },
    totalPrice: (state) => {
        return state.totalPrice
    },
};

export default {
    state,
    mutations,
    actions,
    getters
}