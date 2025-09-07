import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Star, GitFork, Eye } from 'lucide-react';

interface RepositoryCardProps {
  repository: {
    name: string;
    full_name: string;
    description: string;
    language: string;
    stargazers_count: number;
    forks_count: number;
    watchers_count?: number;
    updated_at: string;
    html_url: string;
    owner: {
      login: string;
      avatar_url: string;
    };
  };
  onClick?: () => void;
}

const RepositoryCard: React.FC<RepositoryCardProps> = ({ repository, onClick }) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  return (
    <StyledWrapper>
      <motion.div 
        className="card"
        onClick={onClick}
        whileHover={{ y: -5 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2 }}
      >
        <div className="repo-header">
          <img 
            src={repository.owner.avatar_url || 'https://github.com/ghost.png'} 
            alt={repository.owner.login}
            className="avatar"
          />
          <div className="repo-info">
            <p className="repo-name">{repository.name}</p>
            <p className="repo-owner">by {repository.owner.login}</p>
          </div>
        </div>
        
        <div className="repo-content">
          <p className="description">
            {repository.description || 'No description available'}
          </p>
          
          <div className="language-tag">
            {repository.language && (
              <span className="language">{repository.language}</span>
            )}
          </div>
        </div>

        <div className="repo-stats">
          <div className="stat">
            <Star size={14} />
            <span>{formatNumber(repository.stargazers_count)}</span>
          </div>
          <div className="stat">
            <GitFork size={14} />
            <span>{formatNumber(repository.forks_count)}</span>
          </div>
          <div className="stat">
            <Eye size={14} />
            <span>{formatNumber(repository.watchers_count || 0)}</span>
          </div>
        </div>

        <div className="updated-date">
          Updated {formatDate(repository.updated_at)}
        </div>
      </motion.div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .card {
    position: relative;
    width: 300px;
    height: 280px;
    background-color: #000;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 20px;
    gap: 16px;
    border-radius: 12px;
    cursor: pointer;
    color: white;
    overflow: hidden;
  }

  .card::before {
    content: '';
    position: absolute;
    inset: 0;
    left: -5px;
    margin: auto;
    width: 310px;
    height: 290px;
    border-radius: 15px;
    background: linear-gradient(-45deg, #e81cff 0%, #40c9ff 100%);
    z-index: -10;
    pointer-events: none;
    transition: all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }

  .card::after {
    content: "";
    z-index: -1;
    position: absolute;
    inset: 0;
    background: linear-gradient(-45deg, #fc00ff 0%, #00dbde 100%);
    transform: translate3d(0, 0, 0) scale(0.95);
    filter: blur(20px);
  }

  .repo-header {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.2);
  }

  .repo-info {
    flex: 1;
    min-width: 0;
  }

  .repo-name {
    font-size: 18px;
    font-weight: 700;
    margin: 0;
    color: white;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
  }

  .repo-owner {
    font-size: 13px;
    margin: 0;
    color: rgba(255, 255, 255, 0.7);
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
  }

  .repo-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .description {
    font-size: 14px;
    line-height: 1.4;
    color: rgba(255, 255, 255, 0.8);
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .language-tag {
    display: flex;
    align-items: center;
  }

  .language {
    font-size: 12px;
    padding: 4px 8px;
    border-radius: 12px;
    background: rgba(232, 28, 255, 0.2);
    color: #e81cff;
    font-weight: 600;
    border: 1px solid rgba(232, 28, 255, 0.3);
  }

  .repo-stats {
    display: flex;
    gap: 16px;
    padding: 8px 0;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .stat {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.7);
  }

  .stat svg {
    color: #40c9ff;
  }

  .updated-date {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
    margin: 0;
  }

  .card:hover::after {
    filter: blur(30px);
  }

  .card:hover::before {
    transform: rotate(-90deg) scaleX(1.34) scaleY(0.77);
  }

  .card:hover .repo-name {
    color: #e81cff;
  }

  .card:hover .language {
    background: rgba(232, 28, 255, 0.3);
    border-color: #e81cff;
  }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    .card {
      width: 280px;
      height: 260px;
      padding: 16px;
    }

    .card::before {
      width: 290px;
      height: 270px;
    }

    .repo-name {
      font-size: 16px;
    }

    .description {
      font-size: 13px;
      -webkit-line-clamp: 2;
    }
  }
`;

export default RepositoryCard;
