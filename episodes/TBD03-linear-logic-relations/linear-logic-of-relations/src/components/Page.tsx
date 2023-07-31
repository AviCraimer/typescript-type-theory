import styled from "styled-components/macro";
import { examples1 } from "../logic/examples/expressions";
import { RenderRel } from "./RenderRel";
import { opApp } from "../logic/syntaxTree";

const negR = opApp.neg(examples1.R);
const linNegR = opApp.linNeg(examples1.R);
const { conR, R } = examples1;
const PageContainer = styled.div`
    > p {
        margin-top: 36px;
        margin-bottom: 12px;
    }
`;

type Props = {};

export const Page = ({}: Props) => {
    return (
        <PageContainer>
            <p>R</p>
            <RenderRel root={true}>{R}</RenderRel>
            <p>Converse of R</p>
            <RenderRel root={true}>{conR}</RenderRel>
            <p>Classical Negation of R</p>
            <RenderRel root={true}>{negR}</RenderRel>
            <p>Linear negation of R</p>
            <RenderRel root={true}>{linNegR}</RenderRel>
        </PageContainer>
    );
};
