`timescale 1ns / 1ps

module execute_stage(

    input  logic [31:0] rs1_data,
    input  logic [31:0] rs2_data,
    input  logic [31:0] immediate,

    input  logic ALUSrc,

    input  logic [3:0] alu_control,

    output logic [31:0] alu_result,
    output logic zero

);

logic [31:0] operand_b;

assign operand_b = (ALUSrc) ? immediate : rs2_data;

alu ALU(

    .a(rs1_data),
    .b(operand_b),
    .alu_control(alu_control),
    .result(alu_result),
    .zero(zero)

);

endmodule