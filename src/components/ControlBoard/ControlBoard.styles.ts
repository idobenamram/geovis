import styled from 'styled-components';

export const StyledControlBoard = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  grid-gap: 0.2rem;
  padding: 0.2rem;
  align-items: start;
  width: 10rem;
  height: auto;
  z-index: 1;
  background: #2e3232;
  border: 2px solid #2e3232;
  border-radius: 0.2rem;
  color: white;
`;

export const Section = styled.div`
  display: grid;
  grid-gap: 0.2rem;
`;

export const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.2rem;
  background: #3e4242;
  border-radius: 0.2rem;
  cursor: pointer;
  user-select: none;

  &:hover {
    background: #4e5252;
  }

  .toggle-icon {
    font-size: 0.8rem;
    transform: rotate(0deg);
    transition: transform 0.2s ease;

    &.collapsed {
      transform: rotate(-90deg);
    }
  }
`;

export const SectionContent = styled.div<{ isOpen: boolean }>`
  display: grid;
  grid-gap: 0.2rem;
  overflow: hidden;
  max-height: ${props => props.isOpen ? '300px' : '0'};
  transition: max-height 0.2s ease-in-out;
  padding: ${props => props.isOpen ? '0.2rem 0' : '0'};
`;
