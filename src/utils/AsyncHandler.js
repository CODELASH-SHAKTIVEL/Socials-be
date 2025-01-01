const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((err) => {
      next(err);
    });
  };
};

// Class: A blueprint for creating objects with properties and methods.
// Constructor: Initializes object properties when instantiated.
// Super: Calls the parent class constructor in a subclass.
// This: Refers to the current instance of the object
// Higher order function is a function which takes a parameter as a function and that function is wrapped in a another function 

// METHOD - 2 
// const asyncHandler = (fn) => async (req, res, next) => {
//   try {
//     await fn(req, res, next);
//   } catch (error) {
//     res.status(err.code || 500).json({
//       success: false,
//       message: err.message,
//     });
//   }
// };

export {asyncHandler}