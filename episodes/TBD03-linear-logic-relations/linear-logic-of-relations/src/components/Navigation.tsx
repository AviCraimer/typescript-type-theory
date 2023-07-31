import { MouseEventHandler } from "react";
import styled from "styled-components";
import { ExamplesPage } from "./pages/ExamplesPage";

const NavContainer = styled.nav`
    padding: 8px;
`;

const NavList = styled.ul`
    list-style: none;
    margin: 0;
    padding: 0;
`;

const NavItem = styled.li`
    margin: 0;
`;
const NavButton = styled.button``;

type Props = {
    children: {
        text: string;
        onClick?: MouseEventHandler<HTMLButtonElement>;
    }[];
};
export const Navigation = ({ children }: Props) => {
    return (
        <NavContainer>
            <NavList>
                {children.map((btn) => (
                    <NavItem key={btn.text}>
                        <NavButton onClick={btn.onClick}>{btn.text}</NavButton>
                    </NavItem>
                ))}
            </NavList>
        </NavContainer>
    );
};

export const pages = {
    examples: ["Examples Page", ExamplesPage],
    expressionBuilder: ["Expression Builder Page", ExamplesPage], //  ExpressionBuilderPage
} as const;

export type PageNames = keyof typeof pages;

export const getNavButtons = (
    setPageName: React.Dispatch<
        React.SetStateAction<"examples" | "expressionBuilder">
    >
) => [
    {
        text: "Examples",
        onClick: () => {
            setPageName("examples");
        },
    },
    {
        text: "Expression Builder",
        onClick: () => {
            setPageName("expressionBuilder");
        },
    },
];
