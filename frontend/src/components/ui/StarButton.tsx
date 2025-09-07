import React from 'react';
import styled from 'styled-components';

interface StarButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  $allowVisualHover?: boolean; // Use $ prefix to prevent it from being passed to DOM
}

const StarButton: React.FC<StarButtonProps> = ({ 
  children, 
  onClick, 
  disabled = false,
  $allowVisualHover = false,
  className = ""
}) => {
  return (
    <StyledWrapper className={className} $allowVisualHover={$allowVisualHover}>
      <button onClick={onClick} disabled={disabled}>
        {children}
        <div className="star-1">
          <svg xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 784.11 815.53" version="1.1" xmlSpace="preserve" xmlns="http://www.w3.org/2000/svg">
            <g id="Layer_x0020_1">
              <path d="M392.05 0c-20.9,210.08 -184.06,378.41 -392.05,407.78 207.96,29.37 371.12,197.68 392.05,407.74 20.93,-210.06 184.09,-378.37 392.05,-407.74 -207.98,-29.38 -371.16,-197.69 -392.06,-407.78z" className="fil0" />
            </g>
          </svg>
        </div>
        <div className="star-2">
          <svg xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 784.11 815.53" version="1.1" xmlSpace="preserve" xmlns="http://www.w3.org/2000/svg">
            <g id="Layer_x0020_1">
              <path d="M392.05 0c-20.9,210.08 -184.06,378.41 -392.05,407.78 207.96,29.37 371.12,197.68 392.05,407.74 20.93,-210.06 184.09,-378.37 392.05,-407.74 -207.98,-29.38 -371.16,-197.69 -392.06,-407.78z" className="fil0" />
            </g>
          </svg>
        </div>
        <div className="star-3">
          <svg xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 784.11 815.53" version="1.1" xmlSpace="preserve" xmlns="http://www.w3.org/2000/svg">
            <g id="Layer_x0020_1">
              <path d="M392.05 0c-20.9,210.08 -184.06,378.41 -392.05,407.78 207.96,29.37 371.12,197.68 392.05,407.74 20.93,-210.06 184.09,-378.37 392.05,-407.74 -207.98,-29.38 -371.16,-197.69 -392.06,-407.78z" className="fil0" />
            </g>
          </svg>
        </div>
        <div className="star-4">
          <svg xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 784.11 815.53" version="1.1" xmlSpace="preserve" xmlns="http://www.w3.org/2000/svg">
            <g id="Layer_x0020_1">
              <path d="M392.05 0c-20.9,210.08 -184.06,378.41 -392.05,407.78 207.96,29.37 371.12,197.68 392.05,407.74 20.93,-210.06 184.09,-378.37 392.05,-407.74 -207.98,-29.38 -371.16,-197.69 -392.06,-407.78z" className="fil0" />
            </g>
          </svg>
        </div>
        <div className="star-5">
          <svg xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 784.11 815.53" version="1.1" xmlSpace="preserve" xmlns="http://www.w3.org/2000/svg">
            <g id="Layer_x0020_1">
              <path d="M392.05 0c-20.9,210.08 -184.06,378.41 -392.05,407.78 207.96,29.37 371.12,197.68 392.05,407.74 20.93,-210.06 184.09,-378.37 392.05,-407.74 -207.98,-29.38 -371.16,-197.69 -392.06,-407.78z" className="fil0" />
            </g>
          </svg>
        </div>
        <div className="star-6">
          <svg xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 784.11 815.53" version="1.1" xmlSpace="preserve" xmlns="http://www.w3.org/2000/svg">
            <g id="Layer_x0020_1">
              <path d="M392.05 0c-20.9,210.08 -184.06,378.41 -392.05,407.78 207.96,29.37 371.12,197.68 392.05,407.74 20.93,-210.06 184.09,-378.37 392.05,-407.74 -207.98,-29.38 -371.16,-197.69 -392.06,-407.78z" className="fil0" />
            </g>
          </svg>
        </div>
      </button>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div<{ $allowVisualHover?: boolean }>`
  button {
    position: relative;
    padding: 16px 28px;
    background: #ffffff;
    font-size: 16px;
    font-weight: 600;
    color: #000000;
    box-shadow: 0px 0px 8px 0px rgb(255, 255, 255);
    border-radius: 30px;
    border: none;
    transition: all 0.3s ease-in-out;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    min-width: 140px;
  }

  .star-1 {
    position: absolute;
    top: 20%;
    left: 20%;
    width: 25px;
    height: auto;
    filter: drop-shadow(0 0 0 #fffdef);
    z-index: -5;
    transition: all 0.8s cubic-bezier(0.05, 0.83, 0.43, 0.96);
  }

  .star-2 {
    position: absolute;
    top: 45%;
    left: 45%;
    width: 15px;
    height: auto;
    filter: drop-shadow(0 0 0 #fffdef);
    z-index: -5;
    transition: all 0.8s cubic-bezier(0, 0.4, 0, 1.01);
  }

  .star-3 {
    position: absolute;
    top: 40%;
    left: 40%;
    width: 5px;
    height: auto;
    filter: drop-shadow(0 0 0 #fffdef);
    z-index: -5;
    transition: all 0.8s cubic-bezier(0, 0.4, 0, 1.01);
  }

  .star-4 {
    position: absolute;
    top: 20%;
    left: 40%;
    width: 8px;
    height: auto;
    filter: drop-shadow(0 0 0 #fffdef);
    z-index: -5;
    transition: all 0.8s cubic-bezier(0, 0.4, 0, 1.01);
  }

  .star-5 {
    position: absolute;
    top: 25%;
    left: 45%;
    width: 15px;
    height: auto;
    filter: drop-shadow(0 0 0 #fffdef);
    z-index: -5;
    transition: all 0.8s cubic-bezier(0, 0.4, 0, 1.01);
  }

  .star-6 {
    position: absolute;
    top: 5%;
    left: 50%;
    width: 5px;
    height: auto;
    filter: drop-shadow(0 0 0 #fffdef);
    z-index: -5;
    transition: all 0.8s cubic-bezier(0, 0.4, 0, 1.01);
  }

  button:hover {
    background: #000000;
    color: #ffffff;
    box-shadow: 0 0 80px #ffffff8c;
  }

  button:hover .star-1 {
    position: absolute;
    top: -20%;
    left: -20%;
    width: 20px;
    height: auto;
    filter: drop-shadow(0 0 10px #fffdef);
    z-index: 2;
  }

  button:hover .star-2 {
    position: absolute;
    top: 35%;
    left: -25%;
    width: 15px;
    height: auto;
    filter: drop-shadow(0 0 10px #fffdef);
    z-index: 2;
  }

  button:hover .star-3 {
    position: absolute;
    top: 80%;
    left: -10%;
    width: 10px;
    height: auto;
    filter: drop-shadow(0 0 10px #fffdef);
    z-index: 2;
  }

  button:hover .star-4 {
    position: absolute;
    top: -25%;
    left: 105%;
    width: 20px;
    height: auto;
    filter: drop-shadow(0 0 10px #fffdef);
    z-index: 2;
  }

  button:hover .star-5 {
    position: absolute;
    top: 30%;
    left: 115%;
    width: 15px;
    height: auto;
    filter: drop-shadow(0 0 10px #fffdef);
    z-index: 2;
  }

  button:hover .star-6 {
    position: absolute;
    top: 80%;
    left: 105%;
    width: 10px;
    height: auto;
    filter: drop-shadow(0 0 10px #fffdef);
    z-index: 2;
  }

  .fil0 {
    fill: #fffdef;
  }

  svg {
    shape-rendering: geometricPrecision;
    text-rendering: geometricPrecision;
    image-rendering: optimizeQuality;
    fill-rule: evenodd;
    clip-rule: evenodd;
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: #cccccc;
    color: #666666;
    box-shadow: 0px 0px 5px 0px rgba(204, 204, 204, 0.5);
  }

  /* Allow visual hover effects when $allowVisualHover is true */
  ${props => props.$allowVisualHover && `
    button:disabled:hover {
      background: #ffffff !important;
      color: #000000 !important;
      box-shadow: 0px 0px 15px 0px rgb(255, 255, 255) !important;
    }

    button:disabled:hover .star-1,
    button:disabled:hover .star-2,
    button:disabled:hover .star-3,
    button:disabled:hover .star-4,
    button:disabled:hover .star-5,
    button:disabled:hover .star-6 {
      opacity: 1 !important;
      filter: drop-shadow(0px 0px 6px #d084ff) !important;
    }
  `}

  /* Default disabled hover behavior when $allowVisualHover is false */
  ${props => !props.$allowVisualHover && `
    button:disabled:hover {
      background: #cccccc;
      color: #666666;
      box-shadow: 0px 0px 5px 0px rgba(204, 204, 204, 0.5);
    }
  `}

  button:disabled .star-1,
  button:disabled .star-2,
  button:disabled .star-3,
  button:disabled .star-4,
  button:disabled .star-5,
  button:disabled .star-6 {
    opacity: 0.3;
  }
`;

export default StarButton;