import React, { useState } from 'react';

const Comments = () => {
  // Estado para manejar los comentarios
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [newName, setNewName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [rating, setRating] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Función para manejar el envío de comentarios
  const handleCommentSubmit = (e) => {
    e.preventDefault();

    // Crear un nuevo comentario con nombre, apellido y estrellitas
    const newCommentWithInfo = {
      name: newName,
      lastName: newLastName,
      rating: rating,
      comment: newComment,
    };

    // Agregar el nuevo comentario al estado de comentarios
    setComments([...comments, newCommentWithInfo]);

    // Limpiar los campos del formulario
    setNewComment('');
    setNewName('');
    setNewLastName('');
    setRating(0);

    // Abrir el modal después de enviar el comentario
    openModal();
  };

  // Funciones para manejar la visibilidad del modal
  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="comment-section text-white d-flex">
      <div className="col-md-6">
        {/* Formulario para agregar comentarios */}
        <h2>Sección de Comentarios</h2>
        <form onSubmit={handleCommentSubmit}>
          <div className="mb-3">
            <label htmlFor="nameInput">Nombre:</label>
            <input
              type="text"
              id="nameInput"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label htmlFor="lastNameInput">Apellido:</label>
            <input
              type="text"
              id="lastNameInput"
              value={newLastName}
              onChange={(e) => setNewLastName(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label htmlFor="ratingInput">Estrellitas:</label>
            <input
              type="number"
              id="ratingInput"
              value={rating}
              onChange={(e) => setRating(parseInt(e.target.value))}
              min="0"
              max="5"
              required
            />
          </div>

          <div className="mb-3">
            <label htmlFor="commentInput">Comentario:</label>
            <textarea
              id="commentInput"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Escribe tu comentario aquí"
              required
            ></textarea>
          </div>

          <button type="submit">Enviar Comentario</button>
        </form>
      </div>

      <div className="col-md-6">
        {/* Lista de comentarios */}
        <div className="comment-list">
          {comments.length === 0 ? (
            <p>No hay comentarios aún.</p>
          ) : (
            <ul>
              {comments.map((comment, index) => (
                <li key={index}>
                  <strong>
                    {comment.name} {comment.lastName}
                  </strong>
                  <br />
                  <span>Estrellitas: {comment.rating}</span>
                  <p>{comment.comment}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Modal */}
      <div className={`modal ${isModalOpen ? 'show' : ''}`} id="Alert-comments" tabIndex="-1">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Atención</h5>
              <button type="button" className="btn-close" onClick={closeModal}></button>
            </div>
            <div className="modal-body">
              <div className="">
                Estás a punto de dejar un comentario en nuestra página. Por favor, ten en cuenta que no debes publicar información privada como números de contacto o correos electrónicos. Priorizamos la seguridad y privacidad de nuestros usuarios.
              </div>
            </div>
            <div className="modal-footer">
              <p>¡Gracias por tu comprensión!</p>
              <button type="button" className="btn btn-danger" onClick={closeModal}>
                Publicar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Comments;
