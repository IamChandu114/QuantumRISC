
`timescale 1ns / 1ps
//////////////////////////////////////////////////////////////////////////////////
// Project : QuantumRISC
// Module  : ALU Control
//
// Converts:
// ALUOp + funct3 + funct7
//          ↓
//     4-bit ALU Control
//////////////////////////////////////////////////////////////////////////////////

module alu_control(

    input  logic [1:0] ALUOp,
    input  logic [2:0] funct3,
    input  logic [6:0] funct7,

    output logic [3:0] alu_control

);

always_comb begin

    case(ALUOp)

        // Load / Store
        2'b00:
            alu_control = 4'b0000;   // ADD

        // Branch
        2'b01:
            alu_control = 4'b0001;   // SUB

        // R-Type / I-Type
        2'b10: begin

            case(funct3)

                3'b000: begin
                    if(funct7 == 7'b0100000)
                        alu_control = 4'b0001; // SUB
                    else
                        alu_control = 4'b0000; // ADD
                end

                3'b111:
                    alu_control = 4'b0010;     // AND

                3'b110:
                    alu_control = 4'b0011;     // OR

                3'b100:
                    alu_control = 4'b0100;     // XOR

                3'b001:
                    alu_control = 4'b0101;     // SLL

                3'b101:
                    alu_control = 4'b0110;     // SRL

                3'b010:
                    alu_control = 4'b0111;     // SLT

                default:
                    alu_control = 4'b0000;

            endcase

        end

        default:
            alu_control = 4'b0000;

    endcase

end

endmodule