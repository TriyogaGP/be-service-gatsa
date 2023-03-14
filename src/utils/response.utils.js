module.exports = {
    response: (res, data, statusCode) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.status(statusCode)
        res.json(data)
        res.end()
    },
    OK: (res, data = null, message = null) => {
      res.status(200);
      res.json({
        status: 200,
        message: message || 'SUCCESS',
        result: data,
      });
    },
    NO_CONTENT: res => {
      res.status(204);
      res.json({
        status: 204,
        message: 'data tidak ditemukan',
        result: null,
      });
  
      return res;
    },
    CREATED: (res, data = null, message = null) => {
      res.status(201);
      res.json({
        status: 201,
        message: message || 'SUCCESS',
        result: data,
      });
  
      return res;
    },
    NOT_FOUND: (res, message) => {
      res.status(404);
      res.json({
        status: 404,
        message: message || 'Requested data not found',
        result: null,
      });
  
      return res;
    },
    UNAUTHORIZED: (res, message) => {
      res.status(401);
      res.json({
        status: 401,
        message: message || 'Unauthorized',
        result: null,
      });
  
      return res;
    },
    ERROR: (res, message, data = null) => {
      res.status(500);
      res.json({
        status: 500,
        message: message || 'An error occurred trying to process your request',
        result: data,
      });
  
      return res;
    },
    UNPROCESSABLE: (res, message, data = null) => {
      res.status(422);
      res.json({
        status: 422,
        message: message || 'Unprocessable entity',
        result: data,
      });
  
      return res;
    },
  };
  