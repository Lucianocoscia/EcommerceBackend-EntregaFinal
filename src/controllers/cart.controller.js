import ContenedorMongo from "../classes/ContenedorMongo.js";
import config from "../config/config.js";
import logger from "../lib/logger.js";

import { Product } from "../models/product.model.js";
import { SendMails } from "../services/nodemailer.js";
import CartDaoFactory from "../daos/cartDaoFactory.js";

const productApi = new ContenedorMongo(Product);
const cartDao = CartDaoFactory.getDao(config.db);

const createCart = async (req, res, next) => {
  try {
    const response = await cartDao.create(req.body);

    return response;
  } catch (err) {
    next(err);
  }
};

const updateCart = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const product = await productApi.getById(productId);

    const cart = await cartDao.getByFilter({
      username: req.session.passport.user.username,
    });
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    if (cart.products.some((item) => item.title === product.title)) {
      cart.products.find((item) => item.title === product.title).quantity++;
    } else {
      cart.products.push(product);
    }

    await cartDao.update(
      { username: req.session.passport.user.username },
      cart
    );
    res.redirect("/productos");
  } catch (err) {
    console.log(err);
    logger.error({ error: err }, "Error adding product");

    res.sendStatus(500);
  }
};

const deleteCart = async (req, res, next) => {
  try {
    const { id } = req.params;
    const response = await cartDao.delete(id);

    return response;
  } catch (err) {
    next(err);
  }
};

const findAllCarts = async (req, res, next) => {
  try {
    const response = await cartDao.getAll();

    return response;
  } catch (err) {
    next(err);
  }
};

const findCartById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const response = await cartDao.getById(id);

    return response;
  } catch (err) {
    next(err);
  }
};

const findCartByFilter = async (req, res, next) => {
  try {
    const { user } = req.session.passport;
    const products = await productApi.getAll();
    const userCart = await cartDao.getByFilter({
      username: user.username,
    });
    if (!user) {
      return res.redirect("/");
    }
    res.render("cart", { cart: userCart, user, products });
  } catch (err) {
    logger.error(err);
  }
};

// FUNCION PARA ELIMINAR PRODUCTOS MEDIANTE ID DEL CART
const deleteProductInCart = async (req, res, next) => {
  try {
    const { user } = req.session.passport;
    const { productId } = req.params;
    const product = await productApi.getById(productId);
    const userCart = await cartDao.getByFilter({
      username: user.username,
    });

    const newArray = userCart.products.filter((item) => item._id != productId);

    await cartDao.update({ username: user.username }, { products: newArray });
    res.send("Producto eliminado");
  } catch (err) {
    logger.error(err);
  }
};

//funcion para decrementar cantidad
const decrementQty = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const product = await productApi.getById(productId);
    console.log(product);
    const cart = await cartDao.getByFilter({
      username: req.session.passport.user.username,
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    if (cart.products.some((item) => item.title === product.title)) {
      cart.products.find((item) => item.title === product.title).quantity--;

      // si quantity es 0  eliminar el producto del carrito
      if (
        cart.products.find((item) => item.title === product.title).quantity ===
        0
      ) {
        cart.products = cart.products.filter(
          (item) => item.title !== product.title
        );
      }
    }

    await cartDao.update(
      { username: req.session.passport.user.username },
      cart
    );
    res.redirect("/productos");
  } catch (error) {
    next(error);
  }
};

//revisar por q no me renderiza la view
const finish = async (req, res, next) => {
  try {
    const { user } = req.session.passport;
    const cart = await cartDao.getByFilter({
      username: user.username,
    });
    SendMails.sendMailCart({ cart, user });

    res.render("finish-order", { user });
    res.sendStatus(200);
  } catch (err) {
    logger.error({ error: err }, "Error finish order");
    res.sendStatus(500);
  }
};

export const cartController = {
  createCart,
  updateCart,
  deleteCart,
  findAllCarts,
  findCartById,
  findCartByFilter,
  finish,
  deleteProductInCart,
  decrementQty,
};
