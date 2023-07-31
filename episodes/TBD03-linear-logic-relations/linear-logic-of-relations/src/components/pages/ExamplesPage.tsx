import styled from "styled-components/macro";
import { examples1 } from "../../logic/examples/expressions";
import { RenderRel } from "../RenderRel";
import { opApp } from "../../logic/syntaxTree";

const negR = opApp.neg(examples1.R);
const linNegR = opApp.linNeg(examples1.R);
const { conR, R, S } = examples1;
const conNegR = opApp.converse(negR);
const negConR = opApp.neg(conR);
const RandS = opApp.and(R, S);
const linNegRandRandS = opApp.and(linNegR, RandS);
const RcompS = opApp.comp(R, S);
const complexComposition1 = opApp.comp(linNegRandRandS, RcompS);

const PageContainer = styled.div`
    > p {
        margin-top: 36px;
        margin-bottom: 12px;
    }
`;

type Props = {};

export const ExamplesPage = ({}: Props) => {
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
            <p>Converse Negation R</p>
            <RenderRel root={true}>{conNegR}</RenderRel>
            <p>Negation Converse R</p>
            <RenderRel root={true}>{negConR}</RenderRel>
            <p>R and S</p>
            <RenderRel root={true}>{RandS}</RenderRel>
            <p>Linear Negation R and RandS</p>
            <p>
                Note: the stretched rending will be solved when and is
                implemented as n-ary non-nested operation
            </p>
            <RenderRel root={true}>{linNegRandRandS}</RenderRel>
            <p>R composed with S</p>
            <RenderRel root={true}>{RcompS}</RenderRel>

            <p>Complex Composition</p>
            <RenderRel root={true}>{complexComposition1}</RenderRel>
        </PageContainer>
    );
};
